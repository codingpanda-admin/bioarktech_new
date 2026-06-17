from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from orders.serializers import OrderItemSerializer
from products.models import *
from products.serializers import *
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
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
    queryset = ProductCategory.objects.all().order_by("category_id")
    serializer = ProductCategorySerializer(queryset, many=True)
    return Response(serializer.data)
    
    # return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)


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


@api_view(['GET'])
def get_latest_featured_products(request):
    products = FeaturedProduct.objects.filter(on_display=True).order_by("-catalog_number")[:10]
    serializer = PreviewFeaturedProductSerializer(products, many=True)

    return Response(serializer.data)

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
