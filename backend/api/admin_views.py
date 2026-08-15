import json
import traceback

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, F, Q, Max
from django.utils.text import slugify

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from products.models import (
    Product, FeaturedProduct, ProductsUnion, Image,
    UnitPrice, ManualFile, ProductCategory,
)
from blogs.models import Blog, BlogAttachment, BlogCategory, ResourceDocument
from users.models import User, Address
from quote.models import Quote
from interface.models import (
    ProductMode,
    ServiceMode,
    HomepageSlide,
    AboutWhoWeAre,
    AboutHighlight,
    AboutTeamMember,
    InvestorCompanyOverview,
    InvestorStrategyTier,
    InvestorRoadmapMilestone,
    InvestorPartnerSection,
)
from interface.serializers import (
    AboutWhoWeAreSerializer,
    AboutHighlightSerializer,
    AboutTeamMemberSerializer,
    InvestorCompanyOverviewSerializer,
    InvestorStrategyTierSerializer,
    InvestorRoadmapMilestoneSerializer,
    InvestorPartnerSectionSerializer,
)


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
        reagent_category_ids = [
            'category-1765063995229',
            'category-1766675380397',
            'category-1766675365489',
            'category-1765995504911',
            'category-1780539818236',
        ]
        reagent_products = (
            Q(source_type='reagent')
            | Q(category_external_id__in=reagent_category_ids)
            | Q(category__product_type__in=['reagent', 'consumable'])
        )

        active_catalog = Product.objects.filter(hidden=False)
        active_products = active_catalog.exclude(reagent_products).count()
        active_reagents = active_catalog.filter(reagent_products).count()
        active_services = ServiceMode.objects.filter(hidden=False).count()
        inactive_catalog = (
            Product.objects.filter(hidden=True).count()
            + ServiceMode.objects.filter(hidden=True).count()
        )
        featured_solutions = (
            active_catalog.filter(Q(is_featured=True) | Q(show_in_featured=True)).count()
            + ServiceMode.objects.filter(hidden=False, is_featured=True).count()
        )
        recent_quotes = Quote.objects.order_by('-created_at')[:5]

        total_blogs = Blog.objects.count()
        total_documents = ResourceDocument.objects.count()
        total_media = Image.objects.count()
        total_catalog_items = active_products + active_reagents + active_services

        return Response({
            'total_products': active_products,
            'total_reagents': active_reagents,
            'total_services': active_services,
            'total_catalog_items': total_catalog_items,
            'inactive_catalog_items': inactive_catalog,
            'total_featured_products': featured_solutions,
            'total_featured_solutions': featured_solutions,
            'total_product_categories': ProductCategory.objects.count(),
            'total_blogs': total_blogs,
            'total_blog_categories': BlogCategory.objects.count(),
            'total_users': User.objects.count(),
            'total_quotes': Quote.objects.count(),
            'unread_quotes': Quote.objects.filter(read=False).count(),
            'total_documents': total_documents,
            'total_media': total_media,
            'total_homepage_slides': HomepageSlide.objects.filter(is_active=True).count(),
            'total_about_records': (
                AboutWhoWeAre.objects.filter(is_active=True).count()
                + AboutHighlight.objects.filter(is_active=True).count()
                + AboutTeamMember.objects.filter(is_active=True).count()
            ),
            'total_investor_records': (
                InvestorCompanyOverview.objects.filter(is_active=True).count()
                + InvestorStrategyTier.objects.filter(is_active=True).count()
                + InvestorRoadmapMilestone.objects.filter(is_active=True).count()
                + InvestorPartnerSection.objects.filter(is_active=True).count()
            ),
            'total_content_assets': total_blogs + total_documents + total_media,
            'recent_quotes': [
                {
                    'id': quote.id,
                    'name': f'{quote.first_name} {quote.last_name}'.strip() or quote.email,
                    'service_type': quote.service_type or 'General inquiry',
                    'created_at': quote.created_at.isoformat() if quote.created_at else None,
                    'read': quote.read,
                }
                for quote in recent_quotes
            ],
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
        'show_on_homepage': category.show_on_homepage,
        'homepage_image': category.homepage_image,
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
            show_on_homepage=str(d.get('show_on_homepage', 'false')).lower() == 'true',
            homepage_image=(d.get('homepage_image') or '').strip(),
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

        if 'show_on_homepage' in d:
            value = d.get('show_on_homepage')
            category.show_on_homepage = value if isinstance(value, bool) else str(value).lower() == 'true'

        if 'homepage_image' in d:
            category.homepage_image = (d.get('homepage_image') or '').strip()

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
        hidden = request.GET.get('hidden')

        reagent_category_ids = [
            'category-1765063995229',
            'category-1766675380397',
            'category-1766675365489',
            'category-1765995504911',
            'category-1780539818236',
        ]
        reagent_products = (
            Q(source_type='reagent')
            | Q(category_external_id__in=reagent_category_ids)
            | Q(category__product_type__in=['reagent', 'consumable'])
        )

        products = Product.objects.all().order_by('display_order', '-created_at')
        if source_type == 'reagent':
            products = products.filter(reagent_products)
        elif source_type == 'product':
            products = products.exclude(reagent_products)

        if hidden is not None:
            normalized_hidden = hidden.strip().lower()
            if normalized_hidden in ('true', '1'):
                products = products.filter(hidden=True)
            elif normalized_hidden in ('false', '0'):
                products = products.filter(hidden=False)

        paginator = Paginator(products, page_size)
        page = paginator.get_page(page_number)

        # Build a cache of FeaturedProducts to avoid N+1 queries in the loop
        featured_products_by_cat = {}
        for fp in FeaturedProduct.objects.all():
            if fp.catalog_number:
                featured_products_by_cat[fp.catalog_number.upper()] = fp

        data = []
        for p in page:
            fp = None
            if p.catalog_number:
                fp = featured_products_by_cat.get(p.catalog_number.upper())
            if not fp and p.external_id and p.external_id.startswith('fp-'):
                cat_num = p.external_id[3:].upper()
                fp = featured_products_by_cat.get(cat_num)
                
            p_name = p.product_name
            p_image = p.image_url
            # FeaturedProduct stores legacy detail assets and may continue to exist
            # after a product is unfeatured. The Product flag is the source of truth
            # for whether the admin toggle and homepage featured list are active.
            p_featured = p.is_featured
            
            if fp:
                p_name = fp.product_name or p_name
                # Get main display image from union
                main_img = Image.objects.filter(union=fp.union, main_display=True).first()
                if not main_img:
                    main_img = Image.objects.filter(union=fp.union).first()
                if main_img and main_img.image:
                    p_image = main_img.image.name

            data.append({
                'id': p.product_id,
                'product_name': p_name,
                'external_id': p.external_id,
                'catalog_number': p.catalog_number,
                'category_external_id': p.category_external_id,
                'product_group': p.product_group,
                'hidden': p.hidden,
                'is_featured': p_featured,
                'show_on_screen': p.show_on_screen,
                'image_url': p_image,
                'list_price': p.list_price,
                'discounted_price': p.discounted_price,
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


def _product_manual_file_name(value):
    from urllib.parse import unquote, urlparse

    path = urlparse(str(value or '')).path.replace('\\', '/')
    return unquote(path.rsplit('/', 1)[-1]) or 'Product document'


def _normalize_product_manual_payload(value):
    """Preserve document display names separately from their stored paths."""
    original = []
    names = []
    urls = []

    for item in value or []:
        if isinstance(item, dict):
            manual_path = str(item.get('manual') or item.get('url') or '').strip()
            name = str(item.get('name') or item.get('title') or '').strip()
        else:
            manual_path = str(item or '').strip()
            name = ''

        if not manual_path:
            continue
        if not name or name == manual_path:
            name = _product_manual_file_name(manual_path)

        original.append({'name': name, 'manual': manual_path})
        names.append(name)
        urls.append(manual_path)

    return original, names, urls


def _serialize_product_manuals(product):
    """Return editor-friendly document objects from current and legacy rows."""
    names = list(product.manuals or [])
    urls = list(product.manual_urls or [])
    documents = []

    for index in range(max(len(names), len(urls))):
        name = str(names[index] if index < len(names) else '').strip()
        manual_path = str(urls[index] if index < len(urls) else '').strip()

        # Older admin saves wrote the path into both arrays. Some older imports
        # also stored a path only in manuals.
        if not manual_path and name and (
            '/' in name or '\\' in name or name.lower().endswith(('.pdf', '.doc', '.docx', '.xls', '.xlsx'))
        ):
            manual_path = name
        if manual_path and (not name or name == manual_path):
            name = _product_manual_file_name(manual_path)

        if name or manual_path:
            documents.append({'name': name, 'manual': manual_path})

    return documents


@api_view(['GET'])
def admin_get_product(request, product_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        p = Product.objects.get(product_id=product_id)
        
        # Check if there is an associated FeaturedProduct
        featured_product = None
        if p.catalog_number:
            featured_product = FeaturedProduct.objects.filter(catalog_number=p.catalog_number).first()
        elif p.external_id and p.external_id.startswith('fp-'):
            cat_num = p.external_id[3:].upper()
            featured_product = FeaturedProduct.objects.filter(catalog_number=cat_num).first()

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
            'discounted_price': p.discounted_price,
            'price_range': p.price_range,
            'quote_only': p.quote_only,
            'is_featured': p.is_featured,
            'show_on_screen': p.show_on_screen,
            'show_in_featured': p.show_in_featured,
            'show_in_gene_editing': p.show_in_gene_editing,
            'key_features': p.key_features,
            'options': p.options,
            'option_prices': p.option_prices,
            'option_discounted_prices': p.option_discounted_prices,
            'storage_stability': p.storage_stability,
            'performance_data': p.performance_data,
            'data_description': p.data_description,
            'manuals': p.manuals,
            'manual_urls': p.manual_urls,
            'images': p.images,
            'videos': p.videos,
            'store_link': p.store_link,
            'content_text': p.content_text,
            'hidden': p.hidden,
            'raw_product': p.raw_product,
            'raw_override': p.raw_override,
            'raw_detail': p.raw_detail,
            'created_at': p.created_at,
            'updated_at': p.updated_at,
        }

        if featured_product:
            import re

            # Reagent rich text is maintained on the canonical Product record.
            # Other featured products retain the legacy FeaturedProduct values.
            if p.source_type == 'reagent':
                data['description'] = p.description or featured_product.description
                data['key_features'] = p.key_features or ([featured_product.key_features] if featured_product.key_features else [])
                data['performance_data'] = p.performance_data or featured_product.performance_data
                data['storage_stability'] = p.storage_stability or featured_product.storage_info
            else:
                kf_html = featured_product.key_features or ''
                li_contents = re.findall(r'<li>(.*?)</li>', kf_html, re.DOTALL)
                if li_contents:
                    clean_lis = [re.sub(r'<[^>]*>', '', li).strip() for li in li_contents]
                    data['key_features'] = clean_lis
                elif p.key_features:
                    data['key_features'] = p.key_features
                else:
                    clean_text = re.sub(r'<[^>]*>', '', kf_html).strip()
                    data['key_features'] = [line.strip() for line in clean_text.split('\n') if line.strip()]

                data['description'] = featured_product.description or p.description
                data['performance_data'] = featured_product.performance_data or p.performance_data
                data['storage_stability'] = featured_product.storage_info or p.storage_stability
            
            # Fetch Images associated with featured product's union
            images_qs = Image.objects.filter(union=featured_product.union)
            images_list = []
            for img_obj in images_qs:
                if img_obj.image:
                    images_list.append(img_obj.image.name)
            data['images'] = images_list if images_list else p.images

            # Fetch Manuals associated with featured product's union
            manuals_qs = ManualFile.objects.filter(union=featured_product.union)
            manuals_list = []
            for man_obj in manuals_qs:
                if man_obj.manual:
                    manuals_list.append({
                        'name': man_obj.name,
                        'manual': man_obj.manual.name
                    })
            data['manuals'] = manuals_list if manuals_list else _serialize_product_manuals(p)
        else:
            # For standard products, format manuals list as objects for frontend editor consistency
            data['manuals'] = _serialize_product_manuals(p)

        return Response(data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _sync_featured_product(p, d):
    if p.is_featured or (p.external_id and p.external_id.startswith('fp-')):
        featured_product = None
        if p.catalog_number:
            featured_product = FeaturedProduct.objects.filter(catalog_number=p.catalog_number).first()
        elif p.external_id and p.external_id.startswith('fp-'):
            cat_num = p.external_id[3:].upper()
            featured_product = FeaturedProduct.objects.filter(catalog_number=cat_num).first()
            
        key_features_list = d.get('key_features', p.key_features) or []
        if p.source_type == 'reagent':
            key_features_html = ''.join(key_features_list) if isinstance(key_features_list, list) else str(key_features_list)
        else:
            key_features_html = '<ul>' + ''.join(f'<li>{f}</li>' for f in key_features_list) + '</ul>'

        if not featured_product:
            cat_num = p.catalog_number
            if not cat_num and p.external_id and p.external_id.startswith('fp-'):
                cat_num = p.external_id[3:].upper()
            if cat_num:
                featured_product = FeaturedProduct.objects.create(
                    catalog_number=cat_num,
                    product_name=p.product_name,
                    description=p.description or '',
                    key_features=key_features_html,
                    performance_data=p.performance_data or '',
                    storage_info=p.storage_stability or '',
                    ship_info='Ship with wet ice',
                    shelf_status=True,
                    on_display=False,
                    units_in_stock=100,
                    units='pcs',
                )
        else:
            if p.catalog_number and p.catalog_number != featured_product.catalog_number:
                featured_product.catalog_number = p.catalog_number
            featured_product.product_name = p.product_name
            featured_product.description = p.description or ''
            featured_product.key_features = key_features_html
            featured_product.performance_data = p.performance_data or ''
            featured_product.storage_info = p.storage_stability or ''
            featured_product.save()

        # Sync Images
        if 'images' in d and featured_product:
            new_images = d['images']
            Image.objects.filter(union=featured_product.union).delete()
            for idx, img_path in enumerate(new_images):
                if img_path:
                    clean_path = img_path
                    if clean_path.startswith('/media/'):
                        clean_path = clean_path[len('/media/'):]
                    elif clean_path.startswith('media/'):
                        clean_path = clean_path[len('media/'):]
                    Image.objects.create(
                        union=featured_product.union,
                        image=clean_path,
                        main_display=(idx == 0)
                    )

        # Sync Manuals
        if 'manuals_original' in d and featured_product:
            new_manuals = d['manuals_original']
            ManualFile.objects.filter(union=featured_product.union).delete()
            for man_item in new_manuals:
                if isinstance(man_item, dict):
                    name = man_item.get('name', '')
                    manual_path = man_item.get('manual', '')
                else:
                    name = str(man_item).split('/')[-1] if '/' in str(man_item) else str(man_item)
                    manual_path = str(man_item)
                
                if manual_path:
                    clean_path = manual_path
                    if clean_path.startswith('/media/'):
                        clean_path = clean_path[len('/media/'):]
                    elif clean_path.startswith('media/'):
                        clean_path = clean_path[len('media/'):]
                    ManualFile.objects.create(
                        union=featured_product.union,
                        name=name,
                        manual=clean_path
                    )


@api_view(['POST'])
def admin_create_product(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        d = dict(request.data)
        if 'videos' in d:
            d['videos'] = _normalize_catalog_videos(d['videos'])
        if 'manuals' in d:
            originals, names, urls = _normalize_product_manual_payload(d['manuals'])
            d['manuals_original'] = originals
            d['manuals'] = names
            d['manual_urls'] = urls

        raw_detail = d.get('raw_detail')
        if isinstance(raw_detail, dict) and 'content_text' in d:
            raw_detail = {**raw_detail, 'contentText': d.get('content_text', '')}

        p = Product(
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
            discounted_price=d.get('discounted_price', ''),
            price_range=d.get('price_range', ''),
            quote_only=d.get('quote_only', False),
            is_featured=d.get('is_featured', False),
            show_on_screen=d.get('show_on_screen', False),
            show_in_featured=d.get('show_in_featured', False),
            show_in_gene_editing=d.get('show_in_gene_editing', False),
            key_features=d.get('key_features', []),
            options=d.get('options', []),
            option_prices=d.get('option_prices', {}),
            option_discounted_prices=d.get('option_discounted_prices', {}),
            storage_stability=d.get('storage_stability', ''),
            performance_data=d.get('performance_data', ''),
            data_description=d.get('data_description', ''),
            manuals=d.get('manuals', []),
            manual_urls=d.get('manual_urls', []),
            images=d.get('images', []),
            videos=d.get('videos', []),
            store_link=d.get('store_link', ''),
            content_text=d.get('content_text', ''),
            hidden=d.get('hidden', False),
            raw_product=d.get('raw_product'),
            raw_override=d.get('raw_override'),
            raw_detail=raw_detail,
        )
        p.save()
        _sync_featured_product(p, d)
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
        d = dict(request.data)
        if 'videos' in d:
            d['videos'] = _normalize_catalog_videos(d['videos'])
        if 'manuals' in d:
            originals, names, urls = _normalize_product_manual_payload(d['manuals'])
            d['manuals_original'] = originals
            d['manuals'] = names
            d['manual_urls'] = urls

        updatable_fields = [
            'external_id', 'product_name', 'description', 'image_url',
            'product_link', 'category_external_id', 'product_group',
            'source_type', 'display_order', 'catalog_number', 'availability',
            'list_price', 'discounted_price', 'price_range', 'quote_only', 'is_featured', 'show_on_screen',
            'show_in_featured', 'show_in_gene_editing', 'key_features',
            'options', 'option_prices', 'option_discounted_prices', 'storage_stability', 'performance_data',
            'data_description', 'manuals', 'manual_urls', 'images',
            'videos', 'store_link', 'content_text', 'hidden', 'raw_product',
            'raw_override', 'raw_detail',
        ]

        for field in updatable_fields:
            if field in d:
                setattr(p, field, d[field])

        if 'content_text' in d and isinstance(p.raw_detail, dict):
            p.raw_detail = {**p.raw_detail, 'contentText': p.content_text or ''}

        p.save()
        _sync_featured_product(p, d)
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
        return Response({'message': 'Product deactivated successfully'})
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

        # Determine subfolder based on file extension
        ext = image_file.name.split('.')[-1].lower() if '.' in image_file.name else ''
        subfolder = 'manual_files' if ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx'] else 'product_images'

        from django.core.files.storage import default_storage
        # Save file under media/<subfolder>/
        file_path = f"{subfolder}/{image_file.name}"
        saved_path = default_storage.save(file_path, image_file)
        
        # The database expects a path like "media/product_images/xxx.png"
        relative_url = f"media/{saved_path}"

        return Response({
            'image_path': relative_url,
            'url': request.build_absolute_uri(default_storage.url(saved_path)),
            'message': 'File uploaded successfully'
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
        category_details = {
            category.external_id: {
                'name': category.category_name,
                'type': (category.product_type or '').lower(),
            }
            for category in ProductCategory.objects.exclude(external_id__isnull=True).exclude(external_id='')
        }
        legacy_reagent_category_ids = {
            'category-1765063995229',
            'category-1766675380397',
            'category-1766675365489',
            'category-1765995504911',
            'category-1780539818236',
        }

        buckets = {
            'products': [],
            'services': [],
            'reagents': [],
        }

        products = Product.objects.filter(is_featured=True, hidden=False).order_by(
            F('display_order').asc(nulls_last=True),
            'product_name',
        )
        for product in products:
            category_detail = category_details.get(product.category_external_id, {})
            category_type = category_detail.get('type', '')
            is_reagent = (
                (product.source_type or '').lower() == 'reagent'
                or category_type in ('reagent', 'consumable')
                or product.category_external_id in legacy_reagent_category_ids
            )
            bucket_name = 'reagents' if is_reagent else 'products'
            image_url = product.image_url or next((image for image in (product.images or []) if image), None)

            buckets[bucket_name].append({
                'id': product.product_id,
                'edit_id': product.product_id,
                'item_type': 'reagent' if is_reagent else 'product',
                'product_name': product.product_name,
                'catalog_number': product.catalog_number or '',
                'category_name': category_detail.get('name') or product.category_external_id or 'Uncategorized',
                'group_name': product.product_group or '',
                'external_id': product.external_id,
                'homepage_url': f'/product/{product.external_id}',
                'image_url': image_url,
            })

        services = ServiceMode.objects.filter(is_featured=True, hidden=False).order_by('title')
        for service in services:
            category_detail = category_details.get(service.category, {})
            buckets['services'].append({
                'id': service.id,
                'edit_id': service.id,
                'item_type': 'service',
                'product_name': service.title,
                'catalog_number': service.catalog_number or '',
                'category_name': category_detail.get('name') or service.category or 'Uncategorized',
                'group_name': service.service_group or '',
                'external_id': service.url,
                'homepage_url': f'/product/{service.url}',
                'image_url': request.build_absolute_uri(service.image.url) if service.image else None,
            })

        return Response({
            'buckets': buckets,
            'results': buckets['products'] + buckets['services'] + buckets['reagents'],
        })
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

def _serialize_blog_category(category):
    return {
        'id': category.id,
        'name': category.name,
        'slug': category.slug,
        'description': category.description,
        'display_order': category.display_order,
        'is_active': category.is_active,
        'blog_count': getattr(category, 'blog_count', category.blogs.count()),
    }


def _serialize_blog_attachments(blog, request=None):
    attachments = []
    for attachment in blog.attachments.all():
        file_url = attachment.file.url if attachment.file else ''
        attachments.append({
            'id': attachment.id,
            'name': attachment.original_name,
            'original_name': attachment.original_name,
            'url': request.build_absolute_uri(file_url) if request and file_url else file_url,
            'display_order': attachment.display_order,
            'uploaded_at': attachment.uploaded_at,
        })
    return attachments


def _validate_blog_attachment_files(files):
    allowed_extensions = {
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'csv', 'txt', 'zip', 'png', 'jpg', 'jpeg', 'gif', 'webp',
    }
    for attachment_file in files:
        extension = attachment_file.name.rsplit('.', 1)[-1].lower() if '.' in attachment_file.name else ''
        if extension not in allowed_extensions:
            raise ValueError(
                f'Unsupported attachment type for {attachment_file.name}. '
                'Upload a document, spreadsheet, presentation, archive, text file, or image.'
            )
        if attachment_file.size > 50 * 1024 * 1024:
            raise ValueError(f'{attachment_file.name} must be 50 MB or smaller.')


def _save_blog_attachments(blog, files):
    next_order = blog.attachments.aggregate(Max('display_order'))['display_order__max']
    next_order = (next_order if next_order is not None else -1) + 1
    for offset, attachment_file in enumerate(files):
        original_name = str(attachment_file.name or 'Blog attachment').replace('\\', '/').rsplit('/', 1)[-1]
        BlogAttachment.objects.create(
            blog=blog,
            file=attachment_file,
            original_name=original_name,
            display_order=next_order + offset,
        )


def _parse_blog_attachment_ids(value):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, ValueError, json.JSONDecodeError):
            value = []
    if not isinstance(value, list):
        return []

    attachment_ids = []
    for item in value:
        try:
            attachment_ids.append(int(item))
        except (TypeError, ValueError):
            continue
    return attachment_ids


def _blog_category_boolean(value, default=True):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ('true', '1', 'yes', 'on')


def _validate_blog_category_payload(data, category=None):
    name = str(data.get('name', category.name if category else '') or '').strip()
    if not name:
        raise ValueError('Blog category name is required.')

    duplicate_names = BlogCategory.objects.filter(name__iexact=name)
    if category:
        duplicate_names = duplicate_names.exclude(pk=category.pk)
    if duplicate_names.exists():
        raise ValueError('A blog category with this name already exists.')

    requested_slug = data.get('slug')
    if requested_slug is None and category:
        category_slug = category.slug
    else:
        category_slug = slugify(requested_slug or name)
    if not category_slug:
        raise ValueError('Enter a valid blog category name or URL slug.')

    duplicate_slugs = BlogCategory.objects.filter(slug__iexact=category_slug)
    if category:
        duplicate_slugs = duplicate_slugs.exclude(pk=category.pk)
    if duplicate_slugs.exists():
        raise ValueError('A blog category with this URL slug already exists.')

    try:
        display_order = int(data.get(
            'display_order',
            category.display_order if category else (BlogCategory.objects.aggregate(Max('display_order'))['display_order__max'] or 0) + 1,
        ))
    except (TypeError, ValueError):
        raise ValueError('Display order must be a whole number.')
    if display_order < 0:
        raise ValueError('Display order cannot be negative.')

    return {
        'name': name,
        'slug': category_slug,
        'description': str(data.get('description', category.description if category else '') or '').strip(),
        'display_order': display_order,
        'is_active': _blog_category_boolean(
            data.get('is_active'),
            category.is_active if category else True,
        ),
    }


@api_view(['GET'])
def admin_list_blog_categories(request):
    err = _check_admin(request)
    if err:
        return err

    categories = BlogCategory.objects.annotate(blog_count=Count('blogs')).order_by('display_order', 'name')
    return Response({'results': [_serialize_blog_category(category) for category in categories]})


@api_view(['POST'])
def admin_create_blog_category(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        payload = _validate_blog_category_payload(request.data)
        category = BlogCategory.objects.create(**payload)
        return Response(_serialize_blog_category(category), status=status.HTTP_201_CREATED)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_blog_category(request, category_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        category = BlogCategory.objects.get(pk=category_id)
        payload = _validate_blog_category_payload(request.data, category)
        for field, value in payload.items():
            setattr(category, field, value)
        category.save()
        return Response(_serialize_blog_category(category))
    except BlogCategory.DoesNotExist:
        return Response({'error': 'Blog category not found.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


def _resolve_blog_category(value):
    """Resolve a category id while accepting legacy name and slug values."""
    if value is None or not str(value).strip():
        return None

    normalized_value = str(value).strip()
    query = Q(name__iexact=normalized_value) | Q(slug__iexact=normalized_value)
    if normalized_value.isdigit():
        query |= Q(pk=int(normalized_value))
    return BlogCategory.objects.filter(query, is_active=True).first()

@api_view(['GET'])
def admin_list_blogs(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        blogs = Blog.objects.select_related('category').annotate(attachment_count=Count('attachments')).order_by('-date_posted')
        data = []
        for b in blogs:
            data.append({
                'id': b.id,
                'title': b.title,
                'category': b.category.name,
                'category_id': b.category_id,
                'category_slug': b.category.slug,
                'description': b.description,
                'author': b.author,
                'content': b.content,
                'image': request.build_absolute_uri(b.image.url) if b.image else None,
                'date_posted': b.date_posted,
                'date_modified': b.date_modified,
                'is_featured': b.is_featured,
                'attachment_count': b.attachment_count,
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
        b = Blog.objects.select_related('category').prefetch_related('attachments').get(id=blog_id)
        data = {
            'id': b.id,
            'title': b.title,
            'category': b.category.name,
            'category_id': b.category_id,
            'category_slug': b.category.slug,
            'description': b.description,
            'author': b.author,
            'content': b.content,
            'image': request.build_absolute_uri(b.image.url) if b.image else None,
            'date_posted': b.date_posted,
            'date_modified': b.date_modified,
            'is_featured': b.is_featured,
            'attachments': _serialize_blog_attachments(b, request),
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
        attachment_files = request.FILES.getlist('attachments')
        _validate_blog_attachment_files(attachment_files)
        category_value = d.get('category_id') or d.get('category')
        if category_value is None or not str(category_value).strip():
            return Response({'error': 'Blog category is required.'}, status=status.HTTP_400_BAD_REQUEST)
        category = _resolve_blog_category(category_value)
        if category is None:
            return Response({'error': 'Select a valid blog category.'}, status=status.HTTP_400_BAD_REQUEST)

        b = Blog(
            title=d.get('title', ''),
            category=category,
            description=d.get('description', ''),
            author=d.get('author', ''),
            content=d.get('content', ''),
            is_featured=str(d.get('is_featured', 'false')).lower() == 'true',
        )
        if request.FILES.get('image'):
            b.image = request.FILES['image']
        with transaction.atomic():
            b.save()
            _save_blog_attachments(b, attachment_files)
        return Response({'id': b.id, 'message': 'Blog created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_blog(request, blog_id):
    err = _check_admin(request)
    if err:
        return err

    try:
        b = Blog.objects.select_related('category').get(id=blog_id)
        d = request.data
        attachment_files = request.FILES.getlist('attachments')
        _validate_blog_attachment_files(attachment_files)

        for field in ['title', 'description', 'author', 'content']:
            if field in d:
                setattr(b, field, d[field])

        if 'category_id' in d or 'category' in d:
            category_value = d.get('category_id') or d.get('category')
            if category_value is None or not str(category_value).strip():
                return Response({'error': 'Blog category is required.'}, status=status.HTTP_400_BAD_REQUEST)
            category = _resolve_blog_category(category_value)
            if category is None:
                return Response({'error': 'Select a valid blog category.'}, status=status.HTTP_400_BAD_REQUEST)
            b.category = category

        if 'is_featured' in d:
            b.is_featured = str(d['is_featured']).lower() == 'true'

        if request.FILES.get('image'):
            b.image = request.FILES['image']

        remove_attachment_ids = _parse_blog_attachment_ids(d.get('remove_attachment_ids', []))
        with transaction.atomic():
            b.save()
            attachments_to_remove = list(b.attachments.filter(id__in=remove_attachment_ids))
            for attachment in attachments_to_remove:
                if attachment.file:
                    file_name = attachment.file.name
                    file_storage = attachment.file.storage
                    transaction.on_commit(lambda name=file_name, storage=file_storage: storage.delete(name))
                attachment.delete()
            _save_blog_attachments(b, attachment_files)
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
        b = Blog.objects.prefetch_related('attachments').get(id=blog_id)
        attachment_files = [
            (attachment.file.name, attachment.file.storage)
            for attachment in b.attachments.all()
            if attachment.file
        ]
        with transaction.atomic():
            b.delete()
            for file_name, file_storage in attachment_files:
                transaction.on_commit(lambda name=file_name, storage=file_storage: storage.delete(name))
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
        is_active = request.GET.get('is_active')

        users = User.objects.all().order_by('-date_joined')
        if is_active is not None:
            normalized_is_active = is_active.strip().lower()
            if normalized_is_active in ('true', '1'):
                users = users.filter(is_active=True)
            elif normalized_is_active in ('false', '0'):
                users = users.filter(is_active=False)

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

        if not u.is_active:
            u.is_admin = False
            u.is_staff = False
            u.is_superuser = False

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
        u.is_admin = False
        u.is_staff = False
        u.is_superuser = False
        u.save(update_fields=['is_active', 'is_admin', 'is_staff', 'is_superuser'])
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
        if not u.is_active:
            return Response(
                {'error': 'A deactivated user cannot be granted admin access'},
                status=status.HTTP_400_BAD_REQUEST,
            )
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

def _normalize_service_manuals(value):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, ValueError, json.JSONDecodeError):
            value = []

    if not isinstance(value, list):
        return []

    documents = []
    for item in value:
        if isinstance(item, dict):
            name = str(item.get('name') or '').strip()
            manual = str(item.get('manual') or item.get('url') or '').strip()
        else:
            manual = str(item or '').strip()
            name = ''

        if manual:
            documents.append({
                'name': name if name and name != manual else _product_manual_file_name(manual),
                'manual': manual,
            })

    return documents


def _normalize_catalog_videos(value):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, ValueError, json.JSONDecodeError):
            value = [value]

    if not isinstance(value, list):
        return []

    videos = []
    for item in value:
        video_path = str(item or '').strip()
        if video_path and video_path not in videos:
            videos.append(video_path)
    return videos


@api_view(['GET'])
def admin_list_services(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        hidden = request.GET.get('hidden')
        services = ServiceMode.objects.all()
        if hidden is not None:
            normalized_hidden = hidden.strip().lower()
            if normalized_hidden in ('true', '1'):
                services = services.filter(hidden=True)
            elif normalized_hidden in ('false', '0'):
                services = services.filter(hidden=False)

        data = []
        for s in services:
            data.append({
                'id': s.id,
                'url': s.url,
                'external_id': s.url,
                'title': s.title,
                'catalog_number': s.catalog_number,
                'content': s.content,
                'technique': s.technique,
                'price': s.price,
                'performance_data': s.performance_data,
                'manuals': _normalize_service_manuals(s.manuals),
                'videos': _normalize_catalog_videos(s.videos),
                'image': request.build_absolute_uri(s.image.url) if s.image else None,
                'category': s.category,
                'service_group': s.service_group,
                'is_featured': s.is_featured,
                'show_on_screen': s.show_on_screen,
                'hidden': s.hidden,
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
            'external_id': s.url,
            'title': s.title,
            'catalog_number': s.catalog_number,
            'content': s.content,
            'technique': s.technique,
            'price': s.price,
            'performance_data': s.performance_data,
            'manuals': _normalize_service_manuals(s.manuals),
            'videos': _normalize_catalog_videos(s.videos),
            'image': request.build_absolute_uri(s.image.url) if s.image else None,
            'category': s.category,
            'service_group': s.service_group,
            'is_featured': s.is_featured,
            'show_on_screen': s.show_on_screen,
            'hidden': s.hidden,
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
        is_featured_val = d.get('is_featured', False)
        if isinstance(is_featured_val, str):
            is_featured_val = is_featured_val.lower() == 'true'
        show_on_screen_val = d.get('show_on_screen', False)
        if isinstance(show_on_screen_val, str):
            show_on_screen_val = show_on_screen_val.lower() == 'true'
        hidden_val = d.get('hidden', False)
        if isinstance(hidden_val, str):
            hidden_val = hidden_val.lower() == 'true'
        s = ServiceMode(
            url=d.get('url', ''),
            title=d.get('title', ''),
            catalog_number=d.get('catalog_number', ''),
            content=d.get('content', ''),
            technique=d.get('technique', ''),
            price=d.get('price', ''),
            performance_data=d.get('performance_data', ''),
            manuals=_normalize_service_manuals(d.get('manuals', [])),
            videos=_normalize_catalog_videos(d.get('videos', [])),
            category=d.get('category', ''),
            service_group=d.get('service_group', ''),
            is_featured=is_featured_val,
            show_on_screen=show_on_screen_val,
            hidden=hidden_val,
        )
        if request.FILES.get('image'):
            s.image = request.FILES['image']
        s.save()
        return Response({
            'id': s.id,
            'image': request.build_absolute_uri(s.image.url) if s.image else None,
            'message': 'Service created successfully',
        }, status=status.HTTP_201_CREATED)
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

        for field in ['url', 'title', 'catalog_number', 'content', 'technique', 'price', 'performance_data', 'category', 'service_group']:
            if field in d:
                setattr(s, field, d[field])

        if 'manuals' in d:
            s.manuals = _normalize_service_manuals(d['manuals'])

        if 'videos' in d:
            s.videos = _normalize_catalog_videos(d['videos'])

        if 'is_featured' in d:
            is_featured_val = d['is_featured']
            if isinstance(is_featured_val, str):
                is_featured_val = is_featured_val.lower() == 'true'
            s.is_featured = is_featured_val

        if 'show_on_screen' in d:
            show_on_screen_val = d['show_on_screen']
            if isinstance(show_on_screen_val, str):
                show_on_screen_val = show_on_screen_val.lower() == 'true'
            s.show_on_screen = show_on_screen_val

        if 'hidden' in d:
            hidden_val = d['hidden']
            if isinstance(hidden_val, str):
                hidden_val = hidden_val.lower() == 'true'
            s.hidden = hidden_val

        remove_image_val = d.get('remove_image', False)
        if isinstance(remove_image_val, str):
            remove_image_val = remove_image_val.lower() == 'true'

        if remove_image_val:
            if s.image:
                s.image.delete(save=False)
            s.image = None
        elif request.FILES.get('image'):
            s.image = request.FILES['image']

        s.save()
        return Response({
            'image': request.build_absolute_uri(s.image.url) if s.image else None,
            'message': 'Service updated successfully',
        })
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
        s.hidden = True
        s.save(update_fields=['hidden'])
        return Response({'message': 'Service deactivated successfully'})
    except ServiceMode.DoesNotExist:
        return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_upload_service_document(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        document_file = request.FILES.get('document')
        if not document_file:
            return Response({'error': 'No document file provided'}, status=status.HTTP_400_BAD_REQUEST)

        extension = document_file.name.rsplit('.', 1)[-1].lower() if '.' in document_file.name else ''
        allowed_extensions = {'pdf', 'doc', 'docx', 'xls', 'xlsx'}
        if extension not in allowed_extensions:
            return Response(
                {'error': 'Unsupported document type. Upload a PDF, Word, or Excel file.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.core.files.storage import default_storage

        saved_path = default_storage.save(f'manual_files/{document_file.name}', document_file)
        return Response({
            'document_path': f'media/{saved_path}',
            'original_name': document_file.name,
            'url': request.build_absolute_uri(default_storage.url(saved_path)),
            'message': 'Document uploaded successfully',
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_upload_catalog_video(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        video_file = request.FILES.get('video')
        if not video_file:
            return Response({'error': 'No video file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        extension = video_file.name.rsplit('.', 1)[-1].lower() if '.' in video_file.name else ''
        if extension not in {'mp4', 'webm', 'ogg'} or not str(video_file.content_type).startswith('video/'):
            return Response(
                {'error': 'Upload an MP4, WebM, or Ogg video.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if video_file.size > 200 * 1024 * 1024:
            return Response(
                {'error': 'The video must be 200 MB or smaller.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.core.files.storage import default_storage
        from django.utils.text import get_valid_filename

        safe_name = get_valid_filename(video_file.name)
        saved_path = default_storage.save(f'catalog_videos/{safe_name}', video_file)
        return Response({
            'video_path': f'media/{saved_path}',
            'url': request.build_absolute_uri(default_storage.url(saved_path)),
            'message': 'Video uploaded successfully.',
        }, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


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

@api_view(['POST'])
def admin_upload_homepage_slide_video(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        video_file = request.FILES.get('video')
        if not video_file:
            return Response(
                {'error': 'No video file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extension = video_file.name.rsplit('.', 1)[-1].lower() if '.' in video_file.name else ''
        allowed_extensions = {'mp4', 'webm', 'ogg'}
        if extension not in allowed_extensions or not str(video_file.content_type).startswith('video/'):
            return Response(
                {'error': 'Upload an MP4, WebM, or Ogg video.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if video_file.size > 200 * 1024 * 1024:
            return Response(
                {'error': 'The video must be 200 MB or smaller.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.core.files.storage import default_storage
        from django.utils.text import get_valid_filename

        safe_name = get_valid_filename(video_file.name)
        saved_path = default_storage.save(f'homepage_videos/{safe_name}', video_file)
        return Response({
            'video_path': f'media/{saved_path}',
            'url': request.build_absolute_uri(default_storage.url(saved_path)),
            'message': 'Video uploaded successfully.',
        }, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

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
                'video_url': s.video_url,
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
            'video_url': s.video_url,
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
            video_url=data.get('video_url', ''),
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
        s.video_url = data.get('video_url', s.video_url)
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


# ===========================================================================
#  ABOUT BIOARK AND INVESTOR PAGE CONTENT
# ===========================================================================

@api_view(['POST'])
def admin_upload_page_content_image(request):
    err = _check_admin(request)
    if err:
        return err

    try:
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {'error': 'No image file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extension = image_file.name.rsplit('.', 1)[-1].lower() if '.' in image_file.name else ''
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        if extension not in allowed_extensions or not str(image_file.content_type).startswith('image/'):
            return Response(
                {'error': 'Upload a JPG, PNG, GIF, or WebP image.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if image_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'The image must be 10 MB or smaller.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.core.files.storage import default_storage
        from django.utils.text import get_valid_filename

        safe_name = get_valid_filename(image_file.name)
        saved_path = default_storage.save(f'page_content_images/{safe_name}', image_file)
        return Response({
            'image_path': f'media/{saved_path}',
            'url': request.build_absolute_uri(default_storage.url(saved_path)),
            'message': 'Image uploaded successfully.',
        }, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

def _boolean_value(value, default=True):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ('true', '1', 'yes', 'on')


def _integer_value(value, default=0):
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return default


INVESTOR_STRATEGY_ICON_CHOICES = {
    '\u25a3',  # Foundation
    '\u25a4',  # Platform
    '\u2301',  # Future
    '\u2697',  # Science
    '\U0001f9ec',  # Gene editing
    '\u25ce',  # Target
    '\u2197',  # Growth
    '\u2726',  # Innovation
    '\u25c8',  # Partnership
}

ABOUT_HIGHLIGHT_ICON_CHOICES = {
    '\u25a6',  # Company
    '\u2697',  # Science
    '\u2723',  # Platform
    '\u2699',  # AI and engineering
    '\u2662',  # Clinical
    '\U0001f9ec',  # Gene editing
    '\u25ce',  # Target
    '\u2726',  # Innovation
    '\u25c8',  # Partnership
}


def _text_list(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _about_page_payload():
    overview = AboutWhoWeAre.objects.order_by('id').first()
    return {
        'overview': AboutWhoWeAreSerializer(overview).data if overview else None,
        'highlights': AboutHighlightSerializer(
            AboutHighlight.objects.all().order_by('display_order', 'id'),
            many=True,
        ).data,
        'team_members': AboutTeamMemberSerializer(
            AboutTeamMember.objects.all().order_by('display_order', 'id'),
            many=True,
        ).data,
    }


def _investor_page_payload():
    overview = InvestorCompanyOverview.objects.order_by('id').first()
    partner = InvestorPartnerSection.objects.order_by('id').first()
    return {
        'overview': (
            InvestorCompanyOverviewSerializer(overview).data if overview else None
        ),
        'strategy_tiers': InvestorStrategyTierSerializer(
            InvestorStrategyTier.objects.all().order_by('display_order', 'id'),
            many=True,
        ).data,
        'milestones': InvestorRoadmapMilestoneSerializer(
            InvestorRoadmapMilestone.objects.all().order_by('display_order', 'id'),
            many=True,
        ).data,
        'partner': InvestorPartnerSectionSerializer(partner).data if partner else None,
    }


def _sync_repeatable_rows(model, rows, allowed_fields, required_field):
    if not isinstance(rows, list):
        raise ValueError('Repeatable section content must be a list.')

    retained_ids = []
    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            raise ValueError('Each repeatable section item must be an object.')

        required_value = str(row.get(required_field) or '').strip()
        if not required_value:
            raise ValueError(f'{required_field.replace("_", " ").title()} is required.')

        row_id = row.get('id')
        instance = model.objects.filter(id=row_id).first() if row_id else model()
        if row_id and not instance:
            raise ValueError(f'{model.__name__} record {row_id} does not exist.')

        for field in allowed_fields:
            if field == 'display_order':
                setattr(instance, field, _integer_value(row.get(field), index))
            elif field == 'is_active':
                setattr(instance, field, _boolean_value(row.get(field), True))
            elif field in ('items', 'full_bio'):
                setattr(instance, field, _text_list(row.get(field)))
            else:
                setattr(instance, field, str(row.get(field) or '').strip())

        instance.save()
        retained_ids.append(instance.id)

    model.objects.exclude(id__in=retained_ids).delete()


@api_view(['GET', 'PUT'])
def admin_about_page_content(request):
    err = _check_admin(request)
    if err:
        return err

    if request.method == 'GET':
        return Response(_about_page_payload())

    try:
        data = request.data
        overview_data = data.get('overview') or {}
        if not str(overview_data.get('section_title') or '').strip():
            return Response(
                {'error': 'Who We Are section title is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for highlight in data.get('highlights', []):
            if str(highlight.get('icon') or '').strip() not in ABOUT_HIGHLIGHT_ICON_CHOICES:
                return Response(
                    {'error': 'Select a valid icon for every About BioArk highlight.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            AboutWhoWeAre.objects.update_or_create(
                slug='main',
                defaults={
                    'page_title': str(overview_data.get('page_title') or '').strip(),
                    'page_subtitle': str(overview_data.get('page_subtitle') or '').strip(),
                    'section_title': str(overview_data.get('section_title') or '').strip(),
                    'paragraphs': _text_list(overview_data.get('paragraphs')),
                    'is_active': _boolean_value(overview_data.get('is_active'), True),
                },
            )
            _sync_repeatable_rows(
                AboutHighlight,
                data.get('highlights', []),
                ('icon', 'title', 'text', 'display_order', 'is_active'),
                'title',
            )
            _sync_repeatable_rows(
                AboutTeamMember,
                data.get('team_members', []),
                (
                    'initials',
                    'name',
                    'role',
                    'image_url',
                    'short_bio',
                    'full_bio',
                    'display_order',
                    'is_active',
                ),
                'name',
            )

        return Response({
            'message': 'About BioArk page content updated successfully.',
            **_about_page_payload(),
        })
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
def admin_investor_page_content(request):
    err = _check_admin(request)
    if err:
        return err

    if request.method == 'GET':
        return Response(_investor_page_payload())

    try:
        data = request.data
        overview_data = data.get('overview') or {}
        partner_data = data.get('partner') or {}
        if not str(overview_data.get('section_title') or '').strip():
            return Response(
                {'error': 'Company Overview & Vision section title is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not str(partner_data.get('section_title') or '').strip():
            return Response(
                {'error': 'Partner section title is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for tier in data.get('strategy_tiers', []):
            if str(tier.get('icon') or '').strip() not in INVESTOR_STRATEGY_ICON_CHOICES:
                return Response(
                    {'error': 'Select a valid icon for every strategy tier.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        button_target = str(partner_data.get('button_target') or '_self').strip()
        if button_target not in ('_self', '_blank'):
            button_target = '_self'

        with transaction.atomic():
            InvestorCompanyOverview.objects.update_or_create(
                slug='main',
                defaults={
                    'page_title': str(overview_data.get('page_title') or '').strip(),
                    'page_subtitle': str(overview_data.get('page_subtitle') or '').strip(),
                    'section_title': str(overview_data.get('section_title') or '').strip(),
                    'paragraphs': _text_list(overview_data.get('paragraphs')),
                    'image_url': str(overview_data.get('image_url') or '').strip(),
                    'image_alt': str(overview_data.get('image_alt') or '').strip(),
                    'is_active': _boolean_value(overview_data.get('is_active'), True),
                },
            )
            _sync_repeatable_rows(
                InvestorStrategyTier,
                data.get('strategy_tiers', []),
                (
                    'icon',
                    'title',
                    'subtitle',
                    'items',
                    'note',
                    'display_order',
                    'is_active',
                ),
                'title',
            )
            _sync_repeatable_rows(
                InvestorRoadmapMilestone,
                data.get('milestones', []),
                ('phase', 'goal', 'period_and_funding', 'display_order', 'is_active'),
                'phase',
            )
            InvestorPartnerSection.objects.update_or_create(
                slug='main',
                defaults={
                    'section_title': str(partner_data.get('section_title') or '').strip(),
                    'text': str(partner_data.get('text') or '').strip(),
                    'button_text': str(partner_data.get('button_text') or '').strip(),
                    'button_url': str(partner_data.get('button_url') or '').strip(),
                    'button_target': button_target,
                    'button_style': str(partner_data.get('button_style') or 'primary').strip(),
                    'contact_email': str(partner_data.get('contact_email') or '').strip(),
                    'is_active': _boolean_value(partner_data.get('is_active'), True),
                },
            )

        return Response({
            'message': 'Investor page content updated successfully.',
            **_investor_page_payload(),
        })
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

