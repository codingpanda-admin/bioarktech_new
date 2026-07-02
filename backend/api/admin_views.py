import json
import traceback

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Q, Max
from django.utils.text import slugify

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from products.models import (
    Product, FeaturedProduct, ProductsUnion, Image,
    UnitPrice, ManualFile, ProductCategory,
)
from blogs.models import Blog, ResourceDocument
from users.models import User, Address
from quote.models import Quote
from interface.models import ProductMode, ServiceMode, HomepageSlide


# ---------------------------------------------------------------------------
# Helper: admin permission check
# ---------------------------------------------------------------------------

def _check_admin(request):
    """Return an error Response if user is not authenticated admin/staff, else None."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not (getattr(request.user, 'is_admin', False) or request.user.is_staff):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _get_resolved_image_url(request, image_field):
    if not image_field:
        return None
    import os
    from django.conf import settings
    filename = os.path.basename(image_field.name)
    subfolder_path = os.path.join(settings.MEDIA_ROOT, 'product_images', filename)
    if os.path.exists(subfolder_path):
        url = f"/media/product_images/{filename}"
    else:
        url = f"/media/{filename}"
    return request.build_absolute_uri(url)


# ===========================================================================
#  DASHBOARD
# ===========================================================================

@api_view(['GET'])
def admin_dashboard_stats(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        return Response({
            'total_products': Product.objects.filter(hidden=False).count(),
            'total_featured_products': FeaturedProduct.objects.count(),
            'total_blogs': Blog.objects.count(),
            'total_users': User.objects.count(),
            'total_quotes': Quote.objects.count(),
            'unread_quotes': Quote.objects.filter(read=False).count(),
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  PRODUCTS CRUD
# ===========================================================================

def _serialize_product_category(category):
    product_count = Product.objects.filter(category_external_id=category.external_id).count()
    service_count = 0
    if category.product_type == 'service':
        service_count = ServiceMode.objects.filter(category=category.external_id).count()
    return {
        'category_id': category.category_id,
        'category_name': category.category_name,
        'description': category.description,
        'priority': category.priority,
        'external_id': category.external_id,
        'product_type': category.product_type,
        'product_count': service_count if category.product_type == 'service' else product_count,
        'service_count': service_count,
    }


@api_view(['GET'])
def admin_list_product_categories(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        product_type = request.GET.get('product_type')
        categories = ProductCategory.objects.all().order_by('priority', 'category_id')
        if product_type:
            categories = categories.filter(product_type=product_type)

        data = [_serialize_product_category(category) for category in categories]
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_product_category(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        name = (d.get('category_name') or '').strip()
        if not name:
            return Response({'error': 'Catalog name is required'}, status=status.HTTP_400_BAD_REQUEST)

        external_id = (d.get('external_id') or slugify(name) or f"category-{ProductCategory.objects.count() + 1}").strip()
        base_external_id = external_id
        suffix = 2
        while ProductCategory.objects.filter(external_id=external_id).exists():
            external_id = f"{base_external_id}-{suffix}"
            suffix += 1

        max_priority = ProductCategory.objects.aggregate(max_priority=Max('priority'))['max_priority'] or 0
        category = ProductCategory.objects.create(
            category_name=name,
            external_id=external_id,
            description=d.get('description') or '',
            priority=d.get('priority') or max_priority + 1,
            product_type=d.get('product_type') or 'product',
        )
        return Response(_serialize_product_category(category), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_product_category(request, category_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        category = ProductCategory.objects.get(category_id=category_id)
        d = request.data

        if 'category_name' in d:
            name = (d.get('category_name') or '').strip()
            if not name:
                return Response({'error': 'Catalog name is required'}, status=status.HTTP_400_BAD_REQUEST)
            category.category_name = name

        if 'priority' in d:
            category.priority = d.get('priority') or 1

        if 'description' in d:
            category.description = d.get('description') or ''

        if 'product_type' in d:
            category.product_type = d.get('product_type') or category.product_type

        category.save()
        return Response(_serialize_product_category(category))
    except ProductCategory.DoesNotExist:
        return Response({'error': 'Catalog not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_reorder_product_categories(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        items = request.data.get('categories', [])
        for index, item in enumerate(items, start=1):
            category_id = item.get('category_id')
            if category_id:
                ProductCategory.objects.filter(category_id=category_id).update(priority=item.get('priority') or index)

        categories = ProductCategory.objects.all().order_by('priority', 'category_id')
        return Response({'results': [_serialize_product_category(category) for category in categories]})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_product_category(request, category_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        category = ProductCategory.objects.get(category_id=category_id)
        if category.product_type == 'service':
            item_count = ServiceMode.objects.filter(category=category.external_id).count()
            item_label = 'service(s)'
        else:
            item_count = Product.objects.filter(category_external_id=category.external_id).count()
            item_label = 'product(s)'

        if item_count > 0:
            return Response(
                {'error': f'This catalog contains {item_count} {item_label}. Move or remove those items before deleting it.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        category.delete()
        return Response({'message': 'Catalog deleted successfully'})
    except ProductCategory.DoesNotExist:
        return Response({'error': 'Catalog not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def admin_list_products(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        page_number = int(request.GET.get('page_number', 1))
        page_size = int(request.GET.get('page_size', 25))
        source_type = request.GET.get('source_type', None)

        products = Product.objects.all().order_by('display_order', '-created_at')
        if source_type == 'reagent':
            products = products.filter(source_type='reagent')
        elif source_type == 'product':
            products = products.exclude(source_type='reagent')

        paginator = Paginator(products, page_size)
        page = paginator.get_page(page_number)

        data = []
        for p in page:
            data.append({
                'id': p.product_id,
                'product_name': p.product_name,
                'external_id': p.external_id,
                'catalog_number': p.catalog_number,
                'category_external_id': p.category_external_id,
                'product_group': p.product_group,
                'hidden': p.hidden,
                'is_featured': p.is_featured,
                'image_url': p.image_url,
                'list_price': p.list_price,
                'source_type': p.source_type,
                'created_at': p.created_at,
            })

        return Response({
            'results': data,
            'total': paginator.count,
            'page': page.number,
            'pages': paginator.num_pages,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_product(request, product_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        p = Product.objects.get(product_id=product_id)
        data = {
            'id': p.product_id,
            'external_id': p.external_id,
            'product_name': p.product_name,
            'description': p.description,
            'image_url': p.image_url,
            'product_link': p.product_link,
            'category_external_id': p.category_external_id,
            'product_group': p.product_group,
            'source_type': p.source_type,
            'display_order': p.display_order,
            'source_created_at_ms': p.source_created_at_ms,
            'source_created_at': p.source_created_at,
            'catalog_number': p.catalog_number,
            'availability': p.availability,
            'list_price': p.list_price,
            'price_range': p.price_range,
            'quote_only': p.quote_only,
            'is_featured': p.is_featured,
            'show_in_featured': p.show_in_featured,
            'show_in_gene_editing': p.show_in_gene_editing,
            'key_features': p.key_features,
            'options': p.options,
            'option_prices': p.option_prices,
            'storage_stability': p.storage_stability,
            'performance_data': p.performance_data,
            'data_description': p.data_description,
            'manuals': p.manuals,
            'manual_urls': p.manual_urls,
            'images': p.images,
            'store_link': p.store_link,
            'content_text': p.content_text,
            'hidden': p.hidden,
            'raw_product': p.raw_product,
            'raw_override': p.raw_override,
            'raw_detail': p.raw_detail,
            'created_at': p.created_at,
            'updated_at': p.updated_at,
        }
        return Response(data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_product(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        raw_detail = d.get('raw_detail')
        if isinstance(raw_detail, dict) and 'content_text' in d:
            raw_detail = {**raw_detail, 'contentText': d.get('content_text', '')}

        p = Product.objects.create(
            external_id=d.get('external_id', ''),
            product_name=d.get('product_name', ''),
            description=d.get('description', ''),
            image_url=d.get('image_url', ''),
            product_link=d.get('product_link', ''),
            category_external_id=d.get('category_external_id', ''),
            product_group=d.get('product_group', ''),
            source_type=d.get('source_type', ''),
            display_order=d.get('display_order'),
            catalog_number=d.get('catalog_number', ''),
            availability=d.get('availability', ''),
            list_price=d.get('list_price', ''),
            price_range=d.get('price_range', ''),
            quote_only=d.get('quote_only', False),
            is_featured=d.get('is_featured', False),
            show_in_featured=d.get('show_in_featured', False),
            show_in_gene_editing=d.get('show_in_gene_editing', False),
            key_features=d.get('key_features', []),
            options=d.get('options', []),
            option_prices=d.get('option_prices', {}),
            storage_stability=d.get('storage_stability', ''),
            performance_data=d.get('performance_data', ''),
            data_description=d.get('data_description', ''),
            manuals=d.get('manuals', []),
            manual_urls=d.get('manual_urls', []),
            images=d.get('images', []),
            store_link=d.get('store_link', ''),
            content_text=d.get('content_text', ''),
            hidden=d.get('hidden', False),
            raw_product=d.get('raw_product'),
            raw_override=d.get('raw_override'),
            raw_detail=raw_detail,
        )
        return Response({'id': p.product_id, 'message': 'Product created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_product(request, product_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        p = Product.objects.get(product_id=product_id)
        d = request.data

        updatable_fields = [
            'external_id', 'product_name', 'description', 'image_url',
            'product_link', 'category_external_id', 'product_group',
            'source_type', 'display_order', 'catalog_number', 'availability',
            'list_price', 'price_range', 'quote_only', 'is_featured',
            'show_in_featured', 'show_in_gene_editing', 'key_features',
            'options', 'option_prices', 'storage_stability', 'performance_data',
            'data_description', 'manuals', 'manual_urls', 'images',
            'store_link', 'content_text', 'hidden', 'raw_product',
            'raw_override', 'raw_detail',
        ]

        for field in updatable_fields:
            if field in d:
                setattr(p, field, d[field])

        if 'content_text' in d and isinstance(p.raw_detail, dict):
            p.raw_detail = {**p.raw_detail, 'contentText': p.content_text or ''}

        p.save()
        return Response({'message': 'Product updated successfully'})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_product(request, product_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        p = Product.objects.get(product_id=product_id)
        p.hidden = True
        p.save()
        return Response({'message': 'Product deleted (hidden) successfully'})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_upload_product_image(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.files.storage import default_storage
        # Save file under media/product_images/
        file_path = f"product_images/{image_file.name}"
        saved_path = default_storage.save(file_path, image_file)
        
        # The database expects a path like "media/product_images/xxx.png"
        relative_url = f"media/{saved_path}"

        return Response({
            'image_path': relative_url,
            'url': request.build_absolute_uri(default_storage.url(saved_path)),
            'message': 'Image uploaded successfully'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



# ===========================================================================
#  FEATURED PRODUCTS CRUD
# ===========================================================================

@api_view(['GET'])
def admin_list_featured_products(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        fps = FeaturedProduct.objects.all().order_by('priority')
        data = []
        for fp in fps:
            # Gather related unit-prices and images via the union FK
            unit_prices = []
            images = []
            if fp.union:
                for up in UnitPrice.objects.filter(union=fp.union):
                    unit_prices.append({
                        'id': up.id,
                        'unit_size': up.unit_size,
                        'list_price': str(up.list_price),
                        'unit_price': str(up.unit_price),
                        'on_discount': up.on_discount,
                    })
                for img in Image.objects.filter(union=fp.union):
                    images.append({
                        'id': img.id,
                        'main_display': img.main_display,
                        'url': _get_resolved_image_url(request, img.image),
                    })

            data.append({
                'id': fp.id,
                'catalog_number': fp.catalog_number,
                'product_name': fp.product_name,
                'description': fp.description,
                'shelf_status': fp.shelf_status,
                'on_display': fp.on_display,
                'on_discount': fp.on_discount,
                'priority': fp.priority,
                'units_in_stock': fp.units_in_stock,
                'units': fp.units,
                'union_id': fp.union_id,
                'unit_prices': unit_prices,
                'images': images,
            })

        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_featured_product(request, fp_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        fp = FeaturedProduct.objects.get(id=fp_id)

        unit_prices = []
        images = []
        manuals = []
        if fp.union:
            for up in UnitPrice.objects.filter(union=fp.union):
                unit_prices.append({
                    'id': up.id,
                    'unit_size': up.unit_size,
                    'list_price': str(up.list_price),
                    'unit_price': str(up.unit_price),
                    'on_discount': up.on_discount,
                })
            for img in Image.objects.filter(union=fp.union):
                images.append({
                    'id': img.id,
                    'main_display': img.main_display,
                    'url': _get_resolved_image_url(request, img.image),
                })
            for mf in ManualFile.objects.filter(union=fp.union):
                manuals.append({
                    'id': mf.id,
                    'name': mf.name,
                    'url': request.build_absolute_uri(mf.manual.url) if mf.manual else None,
                })

        data = {
            'id': fp.id,
            'catalog_number': fp.catalog_number,
            'product_name': fp.product_name,
            'description': fp.description,
            'key_features': fp.key_features,
            'performance_data': fp.performance_data,
            'storage_info': fp.storage_info,
            'ship_info': fp.ship_info,
            'shelf_status': fp.shelf_status,
            'on_display': fp.on_display,
            'on_discount': fp.on_discount,
            'priority': fp.priority,
            'units_in_stock': fp.units_in_stock,
            'units': fp.units,
            'union_id': fp.union_id,
            'unit_prices': unit_prices,
            'images': images,
            'manuals': manuals,
        }
        return Response(data)
    except FeaturedProduct.DoesNotExist:
        return Response({'error': 'Featured product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_featured_product(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        fp = FeaturedProduct(
            catalog_number=d.get('catalog_number', ''),
            product_name=d.get('product_name', ''),
            description=d.get('description', ''),
            key_features=d.get('key_features', ''),
            performance_data=d.get('performance_data', ''),
            storage_info=d.get('storage_info', ''),
            ship_info=d.get('ship_info', ''),
            shelf_status=d.get('shelf_status', True),
            on_display=d.get('on_display', False),
            on_discount=d.get('on_discount', True),
            priority=d.get('priority', 1),
            units_in_stock=d.get('units_in_stock', 0),
            units=d.get('units', ''),
        )
        # save() auto-creates a ProductsUnion if union is not set
        fp.save()
        return Response({'id': fp.id, 'message': 'Featured product created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_featured_product(request, fp_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        fp = FeaturedProduct.objects.get(id=fp_id)
        d = request.data

        updatable_fields = [
            'catalog_number', 'product_name', 'description', 'key_features',
            'performance_data', 'storage_info', 'ship_info', 'shelf_status',
            'on_display', 'on_discount', 'priority', 'units_in_stock', 'units',
        ]

        for field in updatable_fields:
            if field in d:
                setattr(fp, field, d[field])

        fp.save()
        return Response({'message': 'Featured product updated successfully'})
    except FeaturedProduct.DoesNotExist:
        return Response({'error': 'Featured product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_featured_product(request, fp_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        fp = FeaturedProduct.objects.get(id=fp_id)
        fp.delete()
        return Response({'message': 'Featured product deleted successfully'})
    except FeaturedProduct.DoesNotExist:
        return Response({'error': 'Featured product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  BLOGS CRUD
# ===========================================================================

@api_view(['GET'])
def admin_list_blogs(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        blogs = Blog.objects.all().order_by('-date_posted')
        data = []
        for b in blogs:
            data.append({
                'id': b.id,
                'title': b.title,
                'description': b.description,
                'author': b.author,
                'content': b.content,
                'image': request.build_absolute_uri(b.image.url) if b.image else None,
                'date_posted': b.date_posted,
                'date_modified': b.date_modified,
                'is_featured': b.is_featured,
            })
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_blog(request, blog_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        b = Blog.objects.get(id=blog_id)
        data = {
            'id': b.id,
            'title': b.title,
            'description': b.description,
            'author': b.author,
            'content': b.content,
            'image': request.build_absolute_uri(b.image.url) if b.image else None,
            'date_posted': b.date_posted,
            'date_modified': b.date_modified,
            'is_featured': b.is_featured,
        }
        return Response(data)
    except Blog.DoesNotExist:
        return Response({'error': 'Blog not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_blog(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        b = Blog(
            title=d.get('title', ''),
            description=d.get('description', ''),
            author=d.get('author', ''),
            content=d.get('content', ''),
            is_featured=str(d.get('is_featured', 'false')).lower() == 'true',
        )
        if request.FILES.get('image'):
            b.image = request.FILES['image']
        b.save()
        return Response({'id': b.id, 'message': 'Blog created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_blog(request, blog_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        b = Blog.objects.get(id=blog_id)
        d = request.data

        for field in ['title', 'description', 'author', 'content']:
            if field in d:
                setattr(b, field, d[field])

        if 'is_featured' in d:
            b.is_featured = str(d['is_featured']).lower() == 'true'

        if request.FILES.get('image'):
            b.image = request.FILES['image']

        b.save()
        return Response({'message': 'Blog updated successfully'})
    except Blog.DoesNotExist:
        return Response({'error': 'Blog not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_blog(request, blog_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        b = Blog.objects.get(id=blog_id)
        b.delete()
        return Response({'message': 'Blog deleted successfully'})
    except Blog.DoesNotExist:
        return Response({'error': 'Blog not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  RESOURCES CRUD
# ===========================================================================

@api_view(['GET'])
def admin_list_resources(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        resources = ResourceDocument.objects.all().order_by('-date_created')
        data = []
        for r in resources:
            data.append({
                'id': r.id,
                'name': r.name,
                'category': r.category,
                'description': r.description,
                'download_url': r.download_url,
                'file': request.build_absolute_uri(r.file.url) if r.file else None,
                'date_created': r.date_created,
            })
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_resource(request, resource_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        r = ResourceDocument.objects.get(id=resource_id)
        data = {
            'id': r.id,
            'name': r.name,
            'category': r.category,
            'description': r.description,
            'download_url': r.download_url,
            'file': request.build_absolute_uri(r.file.url) if r.file else None,
            'date_created': r.date_created,
        }
        return Response(data)
    except ResourceDocument.DoesNotExist:
        return Response({'error': 'Resource not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_resource(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        r = ResourceDocument(
            name=d.get('name', ''),
            category=d.get('category', ''),
            description=d.get('description', ''),
            download_url=d.get('download_url', ''),
        )
        if request.FILES.get('file'):
            r.file = request.FILES['file']
        r.save()
        return Response({'id': r.id, 'message': 'Resource created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_resource(request, resource_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        r = ResourceDocument.objects.get(id=resource_id)
        d = request.data

        for field in ['name', 'category', 'description', 'download_url']:
            if field in d:
                setattr(r, field, d[field])

        if request.FILES.get('file'):
            r.file = request.FILES['file']

        r.save()
        return Response({'message': 'Resource updated successfully'})
    except ResourceDocument.DoesNotExist:
        return Response({'error': 'Resource not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_resource(request, resource_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        r = ResourceDocument.objects.get(id=resource_id)
        r.delete()
        return Response({'message': 'Resource deleted successfully'})
    except ResourceDocument.DoesNotExist:
        return Response({'error': 'Resource not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  USERS CRUD
# ===========================================================================

@api_view(['GET'])
def admin_list_all_users(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        page_number = int(request.GET.get('page_number', 1))
        page_size = int(request.GET.get('page_size', 25))

        users = User.objects.all().order_by('-date_joined')
        paginator = Paginator(users, page_size)
        page = paginator.get_page(page_number)

        data = []
        for u in page:
            data.append({
                'id': u.id,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'company': u.company,
                'mobile': u.mobile,
                'telephone': u.telephone,
                'is_admin': u.is_admin,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
            })

        return Response({
            'results': data,
            'total': paginator.count,
            'page': page.number,
            'pages': paginator.num_pages,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_user(request, user_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        u = User.objects.get(id=user_id)

        def _addr(addr):
            if not addr:
                return None
            return {
                'id': addr.id,
                'address_line_1': addr.address_line_1,
                'address_line_2': addr.address_line_2,
                'apt_suite': addr.apt_suite,
                'city': addr.city,
                'state': addr.state,
                'country': addr.country,
                'zipcode': addr.zipcode,
            }

        data = {
            'id': u.id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'title': u.title,
            'company': u.company,
            'job_title': u.job_title,
            'mobile': u.mobile,
            'telephone': u.telephone,
            'is_admin': u.is_admin,
            'is_staff': u.is_staff,
            'is_active': u.is_active,
            'has_set_password': u.has_set_password,
            'date_joined': u.date_joined,
            'address': _addr(u.address),
            'billing_address': _addr(u.billing_address),
            'shipping_address': _addr(u.shipping_address),
        }
        return Response(data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_user(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        email = d.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=email,
            password=d.get('password'),
            first_name=d.get('first_name', ''),
            last_name=d.get('last_name', ''),
            company=d.get('company', ''),
            is_admin=d.get('is_admin', False),
        )
        return Response({'id': user.id, 'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_user(request, user_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        u = User.objects.get(id=user_id)
        d = request.data

        updatable_fields = [
            'email', 'first_name', 'last_name', 'company',
            'mobile', 'telephone', 'is_admin', 'is_active',
        ]

        for field in updatable_fields:
            if field in d:
                setattr(u, field, d[field])

        u.save()
        return Response({'message': 'User updated successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_user(request, user_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        u = User.objects.get(id=user_id)
        u.is_active = False
        u.save()
        return Response({'message': 'User deactivated successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_toggle_admin(request, user_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        u = User.objects.get(id=user_id)
        u.is_admin = not u.is_admin
        u.save()
        return Response({'message': f'User admin status set to {u.is_admin}', 'is_admin': u.is_admin})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  QUOTES (read-only + mark read + delete)
# ===========================================================================

@api_view(['GET'])
def admin_list_quotes(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        quotes = Quote.objects.all().order_by('read', '-created_at')
        data = []
        for q in quotes:
            data.append({
                'id': q.id,
                'userId': q.user_id,
                'external_id': q.external_id,
                'first_name': q.first_name,
                'last_name': q.last_name,
                'email': q.email,
                'phone': q.phone,
                'company': q.company,
                'department': q.department,
                'service_type': q.service_type,
                'timeline': q.timeline,
                'budget': q.budget,
                'project_description': q.project_description,
                'additional_info': q.additional_info,
                'created_at': q.created_at,
                'read': q.read,
            })
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_quote(request, quote_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        q = Quote.objects.get(id=quote_id)
        data = {
            'id': q.id,
            'userId': q.user_id,
            'external_id': q.external_id,
            'first_name': q.first_name,
            'last_name': q.last_name,
            'email': q.email,
            'phone': q.phone,
            'company': q.company,
            'department': q.department,
            'service_type': q.service_type,
            'timeline': q.timeline,
            'budget': q.budget,
            'project_description': q.project_description,
            'additional_info': q.additional_info,
            'created_at': q.created_at,
            'read': q.read,
        }
        return Response(data)
    except Quote.DoesNotExist:
        return Response({'error': 'Quote not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_mark_quote_read(request, quote_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        q = Quote.objects.get(id=quote_id)
        q.read = not q.read
        q.save()
        return Response({'message': f'Quote read status set to {q.read}', 'read': q.read})
    except Quote.DoesNotExist:
        return Response({'error': 'Quote not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_delete_quote(request, quote_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        q = Quote.objects.get(id=quote_id)
        q.delete()
        return Response({'message': 'Quote deleted successfully'})
    except Quote.DoesNotExist:
        return Response({'error': 'Quote not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  SERVICES CRUD (ServiceMode)
# ===========================================================================

@api_view(['GET'])
def admin_list_services(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        services = ServiceMode.objects.all()
        data = []
        for s in services:
            data.append({
                'id': s.id,
                'url': s.url,
                'title': s.title,
                'content': s.content,
                'image': request.build_absolute_uri(s.image.url) if s.image else None,
                'category': s.category,
            })
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_service(request, service_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        s = ServiceMode.objects.get(id=service_id)
        data = {
            'id': s.id,
            'url': s.url,
            'title': s.title,
            'content': s.content,
            'image': request.build_absolute_uri(s.image.url) if s.image else None,
            'category': s.category,
        }
        return Response(data)
    except ServiceMode.DoesNotExist:
        return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_service(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = request.data
        s = ServiceMode(
            url=d.get('url', ''),
            title=d.get('title', ''),
            content=d.get('content', ''),
            category=d.get('category', ''),
        )
        if request.FILES.get('image'):
            s.image = request.FILES['image']
        s.save()
        return Response({'id': s.id, 'message': 'Service created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_service(request, service_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        s = ServiceMode.objects.get(id=service_id)
        d = request.data

        for field in ['url', 'title', 'content', 'category']:
            if field in d:
                setattr(s, field, d[field])

        if request.FILES.get('image'):
            s.image = request.FILES['image']

        s.save()
        return Response({'message': 'Service updated successfully'})
    except ServiceMode.DoesNotExist:
        return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_service(request, service_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        s = ServiceMode.objects.get(id=service_id)
        s.delete()
        return Response({'message': 'Service deleted successfully'})
    except ServiceMode.DoesNotExist:
        return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  MEDIA MANAGEMENT
# ===========================================================================

@api_view(['GET'])
def admin_list_media(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        images = Image.objects.all().select_related('union')
        data = []
        for img in images:
            # Try to find the associated featured product via union
            fp = None
            if img.union:
                try:
                    fp = FeaturedProduct.objects.get(union=img.union)
                except FeaturedProduct.DoesNotExist:
                    pass

            data.append({
                'id': img.id,
                'url': _get_resolved_image_url(request, img.image),
                'main_display': img.main_display,
                'union_id': img.union_id,
                'product_name': fp.product_name if fp else None,
                'catalog_number': fp.catalog_number if fp else None,
            })
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_upload_media(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

        union_id = request.data.get('union_id')
        main_display = request.data.get('main_display', False)
        # Handle string 'true'/'false' from multipart form data
        if isinstance(main_display, str):
            main_display = main_display.lower() in ('true', '1', 'yes')

        if not union_id:
            return Response({'error': 'union_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            union = ProductsUnion.objects.get(id=union_id)
        except ProductsUnion.DoesNotExist:
            return Response({'error': 'ProductsUnion not found'}, status=status.HTTP_404_NOT_FOUND)

        img = Image.objects.create(
            union=union,
            main_display=main_display,
            image=image_file,
        )

        return Response({
            'id': img.id,
            'url': _get_resolved_image_url(request, img.image),
            'message': 'Image uploaded successfully',
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_delete_media(request, image_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        img = Image.objects.get(id=image_id)
        img.delete()
        return Response({'message': 'Image deleted successfully'})
    except Image.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================================================
#  HOMEPAGE SLIDES CRUD (HomepageSlide)
# ===========================================================================

@api_view(['GET'])
def admin_list_slides(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        slides = HomepageSlide.objects.all().order_by('display_order', 'id')
        data = []
        for s in slides:
            data.append({
                'id': s.id,
                'eyebrow': s.eyebrow,
                'title': s.title,
                'description': s.description,
                'primary_button_text': s.primary_button_text,
                'primary_button_link': s.primary_button_link,
                'secondary_button_text': s.secondary_button_text,
                'secondary_button_link': s.secondary_button_link,
                'image_url': s.image_url,
                'display_order': s.display_order,
                'is_active': s.is_active,
            })
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_get_slide(request, slide_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        s = HomepageSlide.objects.get(id=slide_id)
        return Response({
            'id': s.id,
            'eyebrow': s.eyebrow,
            'title': s.title,
            'description': s.description,
            'primary_button_text': s.primary_button_text,
            'primary_button_link': s.primary_button_link,
            'secondary_button_text': s.secondary_button_text,
            'secondary_button_link': s.secondary_button_link,
            'image_url': s.image_url,
            'display_order': s.display_order,
            'is_active': s.is_active,
        })
    except HomepageSlide.DoesNotExist:
        return Response({'error': 'Slide not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_create_slide(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        data = request.data
        try:
            display_order = int(data.get('display_order', 0))
        except (ValueError, TypeError):
            display_order = 0

        s = HomepageSlide(
            eyebrow=data.get('eyebrow', ''),
            title=data.get('title', ''),
            description=data.get('description', ''),
            primary_button_text=data.get('primary_button_text', ''),
            primary_button_link=data.get('primary_button_link', ''),
            secondary_button_text=data.get('secondary_button_text', ''),
            secondary_button_link=data.get('secondary_button_link', ''),
            image_url=data.get('image_url', ''),
            display_order=display_order,
            is_active=bool(data.get('is_active', True)),
        )
        s.save()
        return Response({'message': 'Slide created successfully', 'id': s.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def admin_update_slide(request, slide_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        s = HomepageSlide.objects.get(id=slide_id)
        data = request.data
        s.eyebrow = data.get('eyebrow', s.eyebrow)
        s.title = data.get('title', s.title)
        s.description = data.get('description', s.description)
        s.primary_button_text = data.get('primary_button_text', s.primary_button_text)
        s.primary_button_link = data.get('primary_button_link', s.primary_button_link)
        s.secondary_button_text = data.get('secondary_button_text', s.secondary_button_text)
        s.secondary_button_link = data.get('secondary_button_link', s.secondary_button_link)
        s.image_url = data.get('image_url', s.image_url)
        try:
            s.display_order = int(data.get('display_order', s.display_order))
        except (ValueError, TypeError):
            pass
        s.is_active = bool(data.get('is_active', s.is_active))
        s.save()
        return Response({'message': 'Slide updated successfully'})
    except HomepageSlide.DoesNotExist:
        return Response({'error': 'Slide not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_reorder_slides(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        slide_ids = request.data.get('slide_ids') or request.data.get('ordered_ids') or []
        if not isinstance(slide_ids, list) or not slide_ids:
            return Response({'error': 'slide_ids must be a non-empty list'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for index, slide_id in enumerate(slide_ids, start=1):
                HomepageSlide.objects.filter(id=slide_id).update(display_order=index)

        return Response({'message': 'Homepage slide order updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def admin_delete_slide(request, slide_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        s = HomepageSlide.objects.get(id=slide_id)
        s.delete()
        return Response({'message': 'Slide deleted successfully'})
    except HomepageSlide.DoesNotExist:
        return Response({'error': 'Slide not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

