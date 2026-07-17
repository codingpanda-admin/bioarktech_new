from django.shortcuts import get_object_or_404, render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from orders.serializers import OrderItemSerializer
from products.models import *
from products.serializers import *
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F, Q
from orders.models import OrderItem
from genes.models import *
from django.core.paginator import Paginator


# Create your views here.
@api_view(['GET'])
def update_shelf_price(request):
    # if request.user.is_authenticated:
    products = Product.objects.all()
    
    for product in products:
        function_type_code = 'Others'
        structure_type_code_2 = None
        target_sequence_code_2 = None

        function_type = product.function_type_code
        structure_type_code = product.structure_type_code
        target_sequence = product.target_sequence.upper()

        delivery_format_codes = DeliveryLibrary.objects.filter(structure_type_symbol=structure_type_code).distinct().values("delivery_format_symbol")

        # check whether function type is CD
        if function_type == 'CD':
            function_type_code = 'CD'
        # check whether structure type is S/T/L/M
        if structure_type_code == 'S' or structure_type_code == 'L':
            structure_type_code_2 = 'S or L'
        else:
            structure_type_code_2 = 'M or T'
        # map target sequence to the right code in design library
        if target_sequence == '000000':
            target_sequence_code = 'Control'
            target_sequence_code_2 = 'Non-Insert; Control'
        elif target_sequence == 'XXXXXX':
            target_sequence_code = 'Non-Insert'
            target_sequence_code_2 = 'Non-Insert; Control'
        else:
            target_sequence_code = 'Gene'

        design_product = DesignLibrary.objects.filter(delivery_format_code__in=product.delivery_format_code,
                                                   shelf_status=True,
                                                   function_type_code=function_type_code,
                                                   structure_type_code__in=[structure_type_code, structure_type_code_2],
                                                   target_sequence__in=[target_sequence_code, target_sequence_code_2],
                                                   ).first()
        print("Product: ", product.product_sku, function_type_code, structure_type_code, structure_type_code_2, target_sequence_code, target_sequence_code_2)
        print("Unit price:", design_product.unit_price, "List price:", design_product.list_price)

        if design_product != None:
            product.list_price = design_product.list_price
            product.unit_price = design_product.unit_price
            product.target_sequence = product.target_sequence.upper()
            product.product_sku = product.product_sku[:-1].upper() + product.product_sku[-1]
            product.save()

    return Response({'success': True})

@api_view(['GET'])
def load_product_categories(request):
    # if request.user.is_authenticated:
    queryset = ProductCategory.objects.all().order_by("priority", "category_id")
    serializer = ProductCategorySerializer(queryset, many=True)
    return Response(serializer.data)
    
    # return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)


DEFAULT_PRODUCT_CATEGORIES = [
    # Products
    {'category_name': 'Genome Editing', 'external_id': 'genome-editing', 'product_type': 'product'},
    {'category_name': 'Vector Stock', 'external_id': 'vector-clones', 'product_type': 'product'},
    {'category_name': 'IVT mRNA', 'external_id': 'category-1764975611348', 'product_type': 'product'},
    {'category_name': 'Purified Protein', 'external_id': 'category-1764975769330', 'product_type': 'product'},
    {'category_name': 'Virus Product', 'external_id': 'lentivirus', 'product_type': 'product'},
    {'category_name': 'Cell Lines', 'external_id': 'stable-cell-lines', 'product_type': 'product'},

    # Services
    {'category_name': 'Genome Editing Services', 'external_id': 'genome-editing-services', 'product_type': 'service'},
    {'category_name': 'Custom Cloning Services', 'external_id': 'synthesis-cloning-services', 'product_type': 'service'},
    {'category_name': 'Stable Cell Line Services', 'external_id': 'cell-line-services', 'product_type': 'service'},
    {'category_name': 'Lentivirus Package Services', 'external_id': 'virus-packaging-services', 'product_type': 'service'},
    {'category_name': 'Vector Construction Support', 'external_id': 'vector-construction-services', 'product_type': 'service'},
    {'category_name': 'Functional Testing', 'external_id': 'functional-testing-services', 'product_type': 'service'},
    {'category_name': 'Experiment Services', 'external_id': 'experiment-services', 'product_type': 'service'},
    {'category_name': 'Lab Supplies', 'external_id': 'lab-supplies-services', 'product_type': 'service'},
    {'category_name': 'Project Consultation', 'external_id': 'project-consultation-services', 'product_type': 'service'},

    # Reagents
    {'category_name': 'DNA Reagents', 'external_id': 'category-1765063995229', 'product_type': 'reagent'},
    {'category_name': 'RNA Reagents', 'external_id': 'category-1766675380397', 'product_type': 'reagent'},
    {'category_name': 'Protein Reagents', 'external_id': 'category-1766675365489', 'product_type': 'reagent'},
    {'category_name': 'Cell Reagents', 'external_id': 'category-1765995504911', 'product_type': 'reagent'},

    # Consumables
    {'category_name': 'Consumables', 'external_id': 'category-1780539818236', 'product_type': 'consumable'},
]

import re

def normalize_name(name):
    if not name:
        return ''
    # remove whitespace and final 's'
    normalized = re.sub(r'\s+', '', name.strip().lower())
    if normalized.endswith('s'):
        normalized = normalized[:-1]
    return normalized

@api_view(['GET'])
def get_nav_catalog(request):
    try:
        # 1. Fetch categories from DB
        db_categories = ProductCategory.objects.all().order_by("priority", "category_id")
        
        # 2. Fetch all products to group them by category and product group
        # Exclude hidden products
        all_products = Product.objects.filter(hidden=False)
        
        products_by_category = {}
        for p in all_products:
            cat_id = p.category_external_id
            if cat_id:
                if cat_id not in products_by_category:
                    products_by_category[cat_id] = []
                products_by_category[cat_id].append(p)
        
        merged_map = {}
        
        # Helper to match database categories to defaults by normalized name
        def find_default_category(db_name, db_type):
            if not db_name:
                return None
            norm_db = normalize_name(db_name)
            
            # Exact normalized check
            for d in DEFAULT_PRODUCT_CATEGORIES:
                if normalize_name(d['category_name']) == norm_db:
                    if not db_type or d.get('product_type') == db_type:
                        return d
            
            # Partial substring check
            db_lower = db_name.strip().lower()
            for d in DEFAULT_PRODUCT_CATEGORIES:
                if db_type and d.get('product_type') != db_type:
                    continue
                d_lower = d['category_name'].strip().lower()
                if db_lower in d_lower or d_lower in db_lower:
                    return d
            return None

        # First, process DB categories
        for cat in db_categories:
            cat_id = cat.external_id
            matched_default = None
            
            # Match by name to DEFAULT_PRODUCT_CATEGORIES if external_id is missing or null
            if cat.category_name:
                matched_default = find_default_category(cat.category_name, cat.product_type)
                
            if matched_default:
                cat_id = matched_default['external_id']
                
            if not cat_id and cat.category_name:
                # slugify
                cat_id = re.sub(r'[^a-z0-9]+', '-', cat.category_name.strip().lower()).strip('-')
                
            if not cat_id:
                cat_id = f"cat-{cat.category_id}"
                
            cat_products = products_by_category.get(cat_id, [])
            
            # Filter out empty orphaned seed categories (like CRISPR-Cas9, RNAi etc. which have no products and are not defaults)
            is_default = any(d['external_id'] == cat_id for d in DEFAULT_PRODUCT_CATEGORIES)
            if not is_default and len(cat_products) == 0 and not cat.external_id:
                continue
                
            # Build subcategories
            subcategories_map = {}
            for p in cat_products:
                group = p.product_group or ''
                if group not in subcategories_map:
                    subcategories_map[group] = []
                subcategories_map[group].append({
                    'product_id': p.product_id,
                    'product_name': p.product_name,
                    'external_id': p.catalog_number or p.external_id,
                    'externalId': p.catalog_number or p.external_id,
                    'catalog_number': p.catalog_number,
                })
                
            subcategories = [{'name': name, 'products': products} for name, products in subcategories_map.items()]
            
            final_name = matched_default['category_name'] if matched_default else cat.category_name
            final_type = matched_default['product_type'] if matched_default else (cat.product_type or 'product')
            
            merged_map[cat_id] = {
                'category_id': cat.category_id,
                'category_name': final_name,
                'external_id': cat_id,
                'externalId': cat_id,
                'product_count': len(cat_products),
                'product_type': final_type,
                'subcategories': subcategories,
            }

        # Next, process defaults fallbacks
        for cat in DEFAULT_PRODUCT_CATEGORIES:
            ext_id = cat['external_id']
            if ext_id not in merged_map:
                cat_products = products_by_category.get(ext_id, [])
                
                subcategories_map = {}
                for p in cat_products:
                    group = p.product_group or ''
                    if group not in subcategories_map:
                        subcategories_map[group] = []
                    subcategories_map[group].append({
                        'product_id': p.product_id,
                        'product_name': p.product_name,
                        'external_id': p.catalog_number or p.external_id,
                        'externalId': p.catalog_number or p.external_id,
                        'catalog_number': p.catalog_number,
                    })
                    
                subcategories = [{'name': name, 'products': products} for name, products in subcategories_map.items()]
                
                merged_map[ext_id] = {
                    'category_id': None,
                    'category_name': cat['category_name'],
                    'external_id': ext_id,
                    'externalId': ext_id,
                    'product_count': len(cat_products),
                    'product_type': cat['product_type'],
                    'subcategories': subcategories,
                }
                
        # Finally, group any uncategorized/custom products in a "Custom Products" category
        # Get all category external IDs currently in our catalog
        active_cat_ids = set(merged_map.keys())
        uncategorized_products = []
        for p in all_products:
            if not p.category_external_id or p.category_external_id not in active_cat_ids:
                uncategorized_products.append(p)
                
        if len(uncategorized_products) > 0:
            subcategories_map = {}
            for p in uncategorized_products:
                group = p.product_group or 'General'
                if group not in subcategories_map:
                    subcategories_map[group] = []
                subcategories_map[group].append({
                    'product_id': p.product_id,
                    'product_name': p.product_name,
                    'external_id': p.catalog_number or p.external_id,
                    'externalId': p.catalog_number or p.external_id,
                    'catalog_number': p.catalog_number,
                })
                
            subcategories = [{'name': name, 'products': products} for name, products in subcategories_map.items()]
            
            merged_map['uncategorized'] = {
                'category_id': None,
                'category_name': 'Custom Products',
                'external_id': 'uncategorized',
                'externalId': 'uncategorized',
                'product_count': len(uncategorized_products),
                'product_type': 'product',
                'subcategories': subcategories,
            }

        return Response(list(merged_map.values()))
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_function_types_by_category(request):
    category_name = request.GET["category_name"]
    queryset = FunctionType.objects.filter(category=category_name)
    serializer = FunctionCategorySerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_structure_types_by_function_type(request):
    function_type_name = request.GET["function_type_name"]
    function_type_symbol = FunctionType.objects.get(function_type_name=function_type_name).function_type_symbol
    structure_types = DeliveryLibrary.objects.filter(function_type_symbol=function_type_symbol).values("structure_type_symbol").distinct()
    queryset = StructureType.objects.filter(structure_type_symbol__in=structure_types).order_by("priority").values("structure_type_symbol", "structure_type_name", "description")

    return Response(list(queryset))


@api_view(['GET'])
def get_code_p_parameters(request):
    function_type_name = request.GET["function_type_name"]
    structure_type_name = request.GET["structure_type_name"]
    # TODO: perform correlation check with function and structure type
    # get function type symbol
    function_type_symbol = FunctionType.objects.get(function_type_name=function_type_name).function_type_symbol
    structure_type_symbol = StructureType.objects.get(structure_type_name=structure_type_name).structure_type_symbol

    data = {
        "promoters": get_promoters(function_type_symbol, structure_type_symbol),
        "protein_tags": get_protein_tags(),
        "fluorescene_markers": get_fluorescene_markers(),
        "selection_markers": get_selection_markers(),
        "bacterial_markers": get_bacterial_markers(structure_type_symbol),
    }
    return Response(data)


@api_view(['GET'])
def get_gene_table_by_symbol(request):
    page_number = request.query_params.get('page_number', 1)
    page_size = request.query_params.get('page_size', 10)
    symbol = request.query_params.get("symbol").upper()
    species = request.query_params.get("species", "")

    gene_items = GeneLibrary.objects.filter(symbol__contains=symbol)

    if species != '':
        gene_items = gene_items.filter(species=species)

    paginator = Paginator(gene_items, page_size)
    page_obj = paginator.get_page(page_number)
    serializer = GeneLibrarySerializer(page_obj, many=True)

    data = {
        'total': gene_items.count(),
        'gene_items': serializer.data
    }

    return Response(data)


@api_view(['GET'])
def get_delivery_format_table(request):
    structure_type_name = request.GET["structure_type_name"]
    function_type_name = request.GET["function_type_name"]
    promoter_name = request.GET["promoter_name"]
    protein_tag_name = request.GET["protein_tag_name"]
    fluorescene_marker_name = request.GET["fluorescene_marker_name"]
    selection_marker_name = request.GET["selection_marker_name"]
    bacterial_marker_name = request.GET["bacterial_marker_name"]
    target_sequence = request.GET["target_sequence"]

    structure_type_symbol = StructureType.objects.get(structure_type_name=structure_type_name).structure_type_symbol
    delivery_format_codes = DeliveryLibrary.objects.filter(structure_type_symbol=structure_type_symbol).distinct().values("delivery_format_symbol")
    promoter_queryset = Promoter.objects.filter(promoter_name=promoter_name).values("promoter_code")
    promoter_special_case_queryset = PromoterSpecialCase.objects.filter(promoter_name=promoter_name).values("promoter_code")
    promoter_code = promoter_queryset.union(promoter_special_case_queryset)[0]['promoter_code']

    bacterial_marker_queryset = BacterialMarker.objects.filter(bacterial_marker_name=bacterial_marker_name).values("bacterial_marker_code")
    bacterial_marker_special_case_queryset = BacterialMarkerSpecialCase.objects.filter(bacterial_marker_name=bacterial_marker_name).values("bacterial_marker_code")
    bacterial_marker_code = bacterial_marker_queryset.union(bacterial_marker_special_case_queryset)[0]['bacterial_marker_code']

    products = Product.objects.filter(delivery_format_code__in=delivery_format_codes,
                                      function_type_code=FunctionType.objects.get(function_type_name=function_type_name).function_type_symbol,
                                      promoter_code=promoter_code,
                                      protein_tag_code=ProteinTag.objects.get(protein_tag_name=protein_tag_name).protein_tag_code,
                                      fluorescene_marker_code=FluoresceneMarker.objects.get(fluorescene_marker_name=fluorescene_marker_name).fluorescene_marker_code,
                                      selection_marker_code=SelectionMarker.objects.get(selection_marker_name=selection_marker_name).selection_marker_code,
                                      bacterial_marker_code=bacterial_marker_code,
                                      target_sequence=target_sequence,
                                      ).distinct()
    
    function_type_code = 'Others'
    structure_type_code = ''
    structure_type_code_2 = None
    target_sequence_code = ''
    target_sequence_code_2 = None
    shelf_status = 0
    # check whether function type is CD
    if function_type_name == 'CRISPR Donor':
        function_type_code = 'CD'
    # check whether structure type is S/T/L/M
    structure_type_code = StructureType.objects.get(structure_type_name=structure_type_name).structure_type_symbol
    if structure_type_name == 'Standard' or structure_type_name == 'Lenti':
        structure_type_code_2 = 'S or L'
    else:
        structure_type_code_2 = 'M or T'
    # map target sequence to the right code in design library
    if target_sequence == '000000':
        target_sequence_code = 'Control'
        target_sequence_code_2 = 'Non-Insert; Control'
    elif target_sequence == 'XXXXXX':
        target_sequence_code = 'Non-Insert'
        target_sequence_code_2 = 'Non-Insert; Control'
    else:
        target_sequence_code = 'Gene'
    
    # check whether product is on-shelf or custom made
    if len(products) > 0:
        shelf_status = 1

    design_products = DesignLibrary.objects.filter(delivery_format_code__in=delivery_format_codes,
                                                   shelf_status=shelf_status,
                                                   function_type_code=function_type_code,
                                                   structure_type_code__in=[structure_type_code, structure_type_code_2],
                                                   target_sequence__in=[target_sequence_code, target_sequence_code_2],
                                                   )
    
    data = {}
    product_id = 0

    for instance in design_products:
        delivery_format_name = DeliveryFormat.objects.get(delivery_format_symbol=instance.delivery_format_code).delivery_format_name
        product_sku = generate_product_sku(function_type_name, structure_type_name, promoter_name,
                                           protein_tag_name, fluorescene_marker_name, selection_marker_name,
                                           bacterial_marker_name, target_sequence, delivery_format_name)
        product = {
            'product_id': product_id,
            'product_sku': product_sku,
            'product_name': generate_product_name(product_sku),
            'delivery_format_name': delivery_format_name,
            'product_format_description': DeliveryFormat.objects.get(delivery_format_symbol=instance.delivery_format_code).description,
            'quantity': instance.kit_amount + " " + instance.unit,
            'unit_price': instance.unit_price,
            'list_price': instance.list_price,
            'ready_status': str(shelf_status),
            'on_discount': instance.on_discount
        }
        if delivery_format_name not in data:
            data[delivery_format_name] = [product]
        else:
            data[delivery_format_name].append(product)

        product_id += 1

    # serializer = DeliveryFormatTableSerializer(design_products, many=True)    

    return Response(data)

@api_view(['GET'])
def get_product_summary(request, product_sku):
    data = decode_product_sku(product_sku)
    return Response(data)

@api_view(['GET'])
def get_product_sku(request):
    function_type_name = request.GET["function_type_name"]
    structure_type_name = request.GET["structure_type_name"]
    promoter_name = request.GET["promoter_name"]
    protein_tag_name = request.GET["protein_tag_name"]
    fluorescene_marker_name = request.GET["fluorescene_marker_name"]
    selection_marker_name = request.GET["selection_marker_name"]
    bacterial_marker_name = request.GET["bacterial_marker_name"]
    target_sequence = request.GET["target_sequence"]
    delivery_format_name = request.GET.get("delivery_format_name")

    product_sku = generate_product_sku(function_type_name, structure_type_name, promoter_name, protein_tag_name, fluorescene_marker_name, selection_marker_name,
                                       bacterial_marker_name, target_sequence, delivery_format_name)
    
    return Response({"product_sku": product_sku})


@api_view(['GET'])
def load_featured_product_page(request, catalog_number):
    product = FeaturedProduct.objects.get(catalog_number=catalog_number)
    serializer = FeaturedProductSerializer(product)

    return Response(serializer.data)


def _get_product_documents(product=None, featured_product=None):
    """Return every product-linked manual/document in one predictable shape."""
    import os
    from urllib.parse import unquote, urlparse

    documents = []
    seen = set()

    def file_name(value):
        path = urlparse(str(value or '')).path
        return unquote(os.path.basename(path)) or 'Product document'

    def add_document(name, url, document_type='Product Document'):
        normalized_name = str(name or '').strip() or file_name(url)
        normalized_url = str(url or '').strip()
        key = (
            'url', normalized_url.lower().removeprefix('/media/')
        ) if normalized_url else ('name', normalized_name.lower())
        if key in seen:
            return
        seen.add(key)
        documents.append({
            'name': normalized_name,
            'url': normalized_url or None,
            'type': document_type,
        })

    if featured_product and featured_product.union:
        for manual_file in ManualFile.objects.filter(union=featured_product.union):
            manual_url = manual_file.manual.url if manual_file.manual else ''
            add_document(manual_file.name, manual_url, 'Product Manual')

    if product:
        manual_names = list(product.manuals or [])
        manual_urls = list(product.manual_urls or [])
        for index in range(max(len(manual_names), len(manual_urls))):
            manual_value = manual_names[index] if index < len(manual_names) else ''
            manual_url = manual_urls[index] if index < len(manual_urls) else ''

            # Newer records can store the file path in both arrays, while
            # imported records keep a display name and URL in parallel arrays.
            if not manual_url and manual_value:
                value_text = str(manual_value)
                if '/' in value_text or '\\' in value_text or value_text.lower().endswith('.pdf'):
                    manual_url = value_text

            manual_name = manual_value
            if manual_url and str(manual_value).strip() == str(manual_url).strip():
                manual_name = file_name(manual_url)
            add_document(manual_name, manual_url, 'Product Document')

    return documents


@api_view(['GET'])
def load_product_by_external_id(request, external_id):
    # 1. Check if there is a FeaturedProduct associated with this external_id or catalog_number
    product = Product.objects.filter(Q(external_id=external_id) | Q(catalog_number=external_id), hidden=False).first()
    
    featured_product = None
    if product and product.catalog_number:
        featured_product = FeaturedProduct.objects.filter(catalog_number=product.catalog_number).first()
    if not featured_product:
        featured_product = FeaturedProduct.objects.filter(catalog_number=external_id).first()
        
    if featured_product:
        serializer = FeaturedProductSerializer(featured_product)
        data = dict(serializer.data)
        source_product = product
        
        # Mix in external_id and externalId
        if product:
            data['external_id'] = product.external_id
            data['externalId'] = product.external_id
        else:
            p = Product.objects.filter(catalog_number=featured_product.catalog_number, hidden=False).first()
            if p:
                source_product = p
                data['external_id'] = p.external_id
                data['externalId'] = p.external_id
            else:
                data['external_id'] = featured_product.catalog_number
                data['externalId'] = featured_product.catalog_number
        if source_product:
            data['product_name'] = source_product.product_name
            data['category_external_id'] = source_product.category_external_id
            data['category_name'] = get_product_category_name(source_product)
            data['availability'] = source_product.availability
            data['content_text'] = source_product.content_text
            data['raw_detail'] = source_product.raw_detail
            data['options'] = source_product.options or []
            data['option_prices'] = source_product.option_prices or {}

            # FeaturedProduct unit-size rows come from a legacy table whose text
            # can contain mojibake. The canonical Product options are maintained
            # in the admin console, so use their labels while preserving the
            # legacy row IDs and numeric pricing fields.
            unit_prices = data.get('unit_prices') or []
            for index, option_name in enumerate(data['options']):
                if index < len(unit_prices):
                    unit_prices[index]['unit_size'] = option_name
        data['documents'] = _get_product_documents(source_product, featured_product)
        return Response(data)

    # 2. If not featured, fall back to standard Product
    if product:
        serializer = ProductSerializer(product)
        data = dict(serializer.data)
        data['documents'] = _get_product_documents(product=product)
        return Response(data)

    # 3. Fall back to ServiceMode (services)
    from interface.models import ServiceMode
    service = ServiceMode.objects.filter(url=external_id).first()
    if service:
        # Get matching ProductCategory to display correct category name
        from products.models import ProductCategory
        cat_name = "Services"
        cat_ext_id = service.category or "services"
        if service.category:
            cat_obj = ProductCategory.objects.filter(external_id=service.category).first()
            if cat_obj:
                cat_name = cat_obj.category_name
        
        # Clean HTML content for description snippet
        import re
        clean_desc = re.sub(r'<[^>]*>', '', service.content)[:250] + "..." if service.content else ""

        service_data = {
            'product_id': f"svc-{service.id}",
            'product_name': service.title,
            'external_id': service.url,
            'externalId': service.url,
            'catalog_number': service.url.upper(),
            'product_sku': service.url,
            'image_url': f"/media/{service.image.name}" if service.image else None,
            'category_name': cat_name,
            'category_external_id': cat_ext_id,
            'product_group': service.service_group,
            'availability': 'Quote Required',
            'quote_only': True,
            'quoteOnly': True,
            'description': clean_desc,
            'content_text': service.content,
            'unit_prices': []
        }
        return Response(service_data)

    return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['GET'])
def get_latest_featured_products(request):
    products = Product.objects.filter(is_featured=True, hidden=False).order_by(
        F("display_order").asc(nulls_last=True),
        "product_name",
    )
    serializer = PreviewFeaturedProductSerializer(products, many=True)

    return Response(serializer.data)


@api_view(['GET'])
def get_featured_general_products(request):
    products = Product.objects.filter(show_on_screen=True, hidden=False).exclude(external_id__startswith='fp-').order_by(
        F("display_order").asc(nulls_last=True),
        "product_name",
    )
    serializer = PreviewFeaturedProductSerializer(products, many=True)

    return Response(serializer.data)


@api_view(['GET'])
def get_product_catalog(request):
    categories = ProductCategory.objects.exclude(external_id__isnull=True).exclude(external_id='').order_by(
        'priority',
        'category_id',
    )

    catalog = []
    seen_category_ids = set()

    for category in categories:
        products = Product.objects.filter(
            category_external_id=category.external_id,
            hidden=False,
        ).order_by(
            F('display_order').asc(nulls_last=True),
            'product_group',
            'product_name',
        )

        if not products.exists():
            continue

        seen_category_ids.add(category.external_id)
        subcategories = {}
        for product in products:
            group = product.product_group or ''
            subcategories.setdefault(group, []).append({
                'product_id': product.product_id,
                'product_name': product.product_name,
                'external_id': product.external_id,
                'externalId': product.external_id,
                'catalog_number': product.catalog_number or product.external_id,
            })

        catalog.append({
            'category_id': category.category_id,
            'category_name': category.category_name,
            'external_id': category.external_id,
            'externalId': category.external_id,
            'product_count': products.count(),
            'subcategories': [
                {'name': group_name, 'products': group_products}
                for group_name, group_products in subcategories.items()
            ],
        })

    uncategorized_ids = Product.objects.filter(hidden=False).exclude(
        category_external_id__in=seen_category_ids,
    ).exclude(category_external_id__isnull=True).exclude(category_external_id='').values_list(
        'category_external_id',
        flat=True,
    ).distinct()

    for category_external_id in uncategorized_ids:
        products = Product.objects.filter(
            category_external_id=category_external_id,
            hidden=False,
        ).order_by(
            F('display_order').asc(nulls_last=True),
            'product_group',
            'product_name',
        )
        subcategories = {}
        for product in products:
            group = product.product_group or ''
            subcategories.setdefault(group, []).append({
                'product_id': product.product_id,
                'product_name': product.product_name,
                'external_id': product.external_id,
                'externalId': product.external_id,
                'catalog_number': product.catalog_number or product.external_id,
            })

        catalog.append({
            'category_id': None,
            'category_name': category_external_id,
            'external_id': category_external_id,
            'externalId': category_external_id,
            'product_count': products.count(),
            'subcategories': [
                {'name': group_name, 'products': group_products}
                for group_name, group_products in subcategories.items()
            ],
        })

    return Response(catalog)

## HELPER METHODS


def generate_product_sku(function_type_name, structure_type_name, promoter_name, protein_tag_name, fluorescene_marker_name, selection_marker_name,
                         bacterial_marker_name, target_sequence, delivery_format_name=None):
    function_type_code = FunctionType.objects.get(function_type_name=function_type_name).function_type_symbol
    structure_type_code = StructureType.objects.get(structure_type_name=structure_type_name).structure_type_symbol

    # Set default values for CodeP
    promoter_code = '0'
    protein_tag_code = '0'
    fluorescene_marker_code = '0'
    selection_marker_code = '0'
    bacterial_marker_code = '0'

    # Promoter code - check special case
    if promoter_name != '':
        promoter_queryset = Promoter.objects.filter(promoter_name=promoter_name).values("promoter_code")
        promoter_special_case_queryset = PromoterSpecialCase.objects.filter(promoter_name=promoter_name).values("promoter_code")
        promoter_code = promoter_queryset.union(promoter_special_case_queryset)[0]['promoter_code']
    # Bacterial Marker code - check special case
    if bacterial_marker_name != '':
        bacterial_marker_queryset = BacterialMarker.objects.filter(bacterial_marker_name=bacterial_marker_name).values("bacterial_marker_code")
        bacterial_marker_special_case_queryset = BacterialMarkerSpecialCase.objects.filter(bacterial_marker_name=bacterial_marker_name).values("bacterial_marker_code")
        bacterial_marker_code = bacterial_marker_queryset.union(bacterial_marker_special_case_queryset)[0]['bacterial_marker_code']

    if protein_tag_name != '':
        protein_tag_code = ProteinTag.objects.get(protein_tag_name=protein_tag_name).protein_tag_code
    
    if fluorescene_marker_name != '':
        fluorescene_marker_code = FluoresceneMarker.objects.get(fluorescene_marker_name=fluorescene_marker_name).fluorescene_marker_code
    
    if selection_marker_name != '':
        selection_marker_code = SelectionMarker.objects.get(selection_marker_name=selection_marker_name).selection_marker_code

    if delivery_format_name:
        delivery_format_code = DeliveryFormat.objects.get(delivery_format_name=delivery_format_name).delivery_format_symbol
    else:
        delivery_format_code = ""

    product_sku = function_type_code + structure_type_code + "-" + promoter_code + 'X' + protein_tag_code + fluorescene_marker_code + selection_marker_code + bacterial_marker_code
    
    if target_sequence != 'null' and target_sequence != 'IGNORE':
        product_sku += "-" + target_sequence + delivery_format_code

    return product_sku

def decode_product_sku(product_sku):
    try:
        # Split the SKU into parts
        part1, part2, target_sequence_with_delivery = product_sku.split("-")
        function_type_code = part1[:2]
        structure_type_code = part1[2:]
        
        promoter_code = part2[0]
        protein_tag_code = part2[2]
        fluorescene_marker_code = part2[3]
        selection_marker_code = part2[4]
        bacterial_marker_code = part2[5]
        
        target_sequence = target_sequence_with_delivery[:6]

        delivery_format_code = None
        # Check if delivery format code is present
        if len(target_sequence_with_delivery) == 7:
            delivery_format_code = target_sequence_with_delivery[-1]
        
        # Retrieve data from the database
        product_category = FunctionType.objects.get(function_type_symbol=function_type_code).category
        function_type_name = FunctionType.objects.get(function_type_symbol=function_type_code).function_type_name
        structure_type_name = StructureType.objects.get(structure_type_symbol=structure_type_code).structure_type_name
        gene_symbol = GeneLibrary.objects.get(target_sequence=target_sequence).symbol

        promoter = Promoter.objects.filter(promoter_code=promoter_code).first()
        if promoter:
            promoter_name = promoter.promoter_name
        else:
            promoter_special_case = PromoterSpecialCase.objects.filter(promoter_code=promoter_code).first()
            promoter_name = promoter_special_case.promoter_name if promoter_special_case else None

        bacterial_marker = BacterialMarker.objects.filter(bacterial_marker_code=bacterial_marker_code).first()
        if bacterial_marker:
            bacterial_marker_name = bacterial_marker.bacterial_marker_name
        else:
            bacterial_marker_special_case = BacterialMarkerSpecialCase.objects.filter(bacterial_marker_code=bacterial_marker_code).first()
            bacterial_marker_name = bacterial_marker_special_case.bacterial_marker_name if bacterial_marker_special_case else None

        protein_tag_name = ProteinTag.objects.get(protein_tag_code=protein_tag_code).protein_tag_name
        fluorescene_marker_name = FluoresceneMarker.objects.get(fluorescene_marker_code=fluorescene_marker_code).fluorescene_marker_name
        selection_marker_name = SelectionMarker.objects.get(selection_marker_code=selection_marker_code).selection_marker_name

        # Get the delivery format name if it exists
        if delivery_format_code:
            delivery_format_name = DeliveryFormat.objects.get(delivery_format_symbol=delivery_format_code).delivery_format_name
        else:
            delivery_format_name = ''

        # Return the decoded components as a dictionary
        return {
            "product_category": product_category,
            "function_type_name": function_type_name,
            "structure_type_name": structure_type_name,
            "promoter_name": promoter_name,
            "protein_tag_name": protein_tag_name,
            "fluorescene_marker_name": fluorescene_marker_name,
            "selection_marker_name": selection_marker_name,
            "bacterial_marker_name": bacterial_marker_name,
            "target_sequence": target_sequence,
            "gene_symbol": gene_symbol,
            "delivery_format_name": delivery_format_name,
        }
    
    except ObjectDoesNotExist as e:
        raise ValueError(f"Decoding failed: {str(e)}")
    except Exception as e:
        raise ValueError(f"Unexpected error during decoding: {str(e)}")


def generate_product_name(product_sku):
    decoded_sku = decode_product_sku(product_sku)
    function_type_name = decoded_sku['function_type_name']
    structure_type_name = decoded_sku['structure_type_name']
    target_sequence = decoded_sku['target_sequence']
    delivery_format_name = decoded_sku['delivery_format_name']

    target_sequence = GeneLibrary.objects.get(target_sequence=target_sequence).symbol

    function_type_abbr = FunctionType.objects.get(function_type_name=function_type_name).abbreviation
    structure_type_abbr = StructureType.objects.get(structure_type_name=structure_type_name).abbreviation

    product_name = f"{function_type_abbr} {structure_type_abbr} Kit--Gene {target_sequence}, {delivery_format_name} type"

    return product_name


def get_promoters(function_type_symbol, structure_type_symbol):
    # check the special case for promoter options
    function_type_count = PromoterSpecialCase.objects.filter(function_type_symbol=function_type_symbol).count()
    if function_type_count > 0:
        queryset = PromoterSpecialCase.objects.filter(function_type_symbol=function_type_symbol).order_by('priority').values("promoter_name", "promoter_code", "enabled")
        return list(queryset)
    
    # structure_type_count = PromoterSpecialCase.objects.filter(structure_type_symbol=structure_type_symbol).count()
    # if structure_type_count > 0:
    #     queryset = PromoterSpecialCase.objects.filter(structure_type_symbol=structure_type_symbol).values("promoter_name", "promoter_code")
    #     return list(queryset)
    
    # return the default promoter options
    queryset = Promoter.objects.all().order_by('priority').values("promoter_name", "promoter_code", "enabled", "description")
    return list(queryset)

def get_protein_tags():
    queryset = ProteinTag.objects.all().order_by('priority').values("protein_tag_name", "protein_tag_code", "enabled", "description")
    return list(queryset)

def get_fluorescene_markers():
    queryset = FluoresceneMarker.objects.all().order_by('priority').values("fluorescene_marker_name", "fluorescene_marker_code", "enabled", "description")
    return list(queryset)

def get_selection_markers():
    queryset = SelectionMarker.objects.all().order_by('priority').values("selection_marker_name", "selection_marker_code", "enabled", "description")
    return list(queryset)

def get_bacterial_markers(structure_type_symbol):
    # check the special case for bacterial marker options
    queryset = BacterialMarkerSpecialCase.objects.filter(structure_type_symbol=structure_type_symbol).order_by('priority').values("bacterial_marker_name", "bacterial_marker_code", "enabled", "description")
    if len(queryset) > 0:
        return list(queryset)
    queryset = BacterialMarker.objects.all().order_by('priority').values("bacterial_marker_name", "bacterial_marker_code", "enabled", "description")
    return list(queryset)
