from django.core.paginator import Paginator
from django.db.models import Prefetch
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    GeneDesignCategory,
    GeneDesignDeliveryType,
    GeneDesignFormatOption,
    GeneDesignFormatType,
    GeneDesignFunctionType,
    GeneDesignStructureOption,
    GeneDesignStructureSubstep,
    GeneDesignTargetGeneOption,
    GeneLibrary,
)
from .pricing import (
    is_design_on_shelf as _is_design_on_shelf,
    lookup_design_price_rule,
    normalize_target_gene_code as _normalize_target_gene_code,
)


@api_view(['GET'])
def get_design_metadata(request):
    active_function_types = GeneDesignFunctionType.objects.filter(
        is_active=True
    ).order_by('display_order', 'id')
    categories = GeneDesignCategory.objects.filter(is_active=True).prefetch_related(
        Prefetch('function_types', queryset=active_function_types)
    ).order_by('display_order', 'id')

    active_structure_options = GeneDesignStructureOption.objects.filter(
        is_active=True
    ).order_by('display_order', 'id')
    structure_substeps = GeneDesignStructureSubstep.objects.filter(
        is_active=True
    ).prefetch_related(
        Prefetch('options', queryset=active_structure_options)
    ).order_by('display_order', 'id')

    active_format_options = GeneDesignFormatOption.objects.filter(
        is_active=True
    ).order_by('display_order', 'id')
    format_types = GeneDesignFormatType.objects.filter(
        is_active=True
    ).prefetch_related(
        Prefetch('options', queryset=active_format_options)
    ).order_by('display_order', 'id')

    return Response({
        'categories': [
            {
                'code': category.code,
                'name': category.name,
                'description': category.description,
                'function_types': [
                    {
                        'symbol_id': function_type.symbol_id,
                        'abbreviation': function_type.abbreviation,
                        'name': function_type.name,
                        'description': function_type.description,
                    }
                    for function_type in category.function_types.all()
                ],
            }
            for category in categories
        ],
        'delivery_types': [
            {
                'symbol_id': delivery_type.symbol_id,
                'abbreviation': delivery_type.abbreviation,
                'name': delivery_type.name,
                'class_name': delivery_type.class_name,
                'description': delivery_type.description,
            }
            for delivery_type in GeneDesignDeliveryType.objects.filter(
                is_active=True
            ).order_by('display_order', 'id')
        ],
        'structure_substeps': [
            {
                'code': substep.code,
                'name': substep.name,
                'options': [
                    {
                        'value': option.value,
                        'value_code': option.value_code,
                    }
                    for option in substep.options.all()
                ],
            }
            for substep in structure_substeps
        ],
        'target_gene_options': [
            {
                'code_id': option.code_id,
                'abbreviation': option.abbreviation,
                'name': option.name,
                'description': option.description,
            }
            for option in GeneDesignTargetGeneOption.objects.filter(
                is_active=True
            ).order_by('display_order', 'id')
        ],
        'format_types': [
            {
                'code_id': format_type.code_id,
                'name': format_type.name,
                'description': format_type.description,
                'shipping_temperature': format_type.shipping_temperature,
                'storage': format_type.storage,
                'stability': format_type.stability,
                'options': [
                    {'unit_amount': option.unit_amount}
                    for option in format_type.options.all()
                ],
            }
            for format_type in format_types
        ],
    })


@api_view(['GET'])
def search_gene_library(request):
    species = request.query_params.get('species', '').strip()
    gene_name = request.query_params.get('gene_name', '').strip()
    description = request.query_params.get('description', '').strip()

    try:
        page_number = max(1, int(request.query_params.get('page', 1)))
    except (TypeError, ValueError):
        page_number = 1
    try:
        page_size = min(50, max(1, int(request.query_params.get('page_size', 20))))
    except (TypeError, ValueError):
        page_size = 20

    genes = GeneLibrary.objects.all()
    if species:
        genes = genes.filter(species__iexact=species)
    if gene_name:
        genes = genes.filter(gene_name__icontains=gene_name)
    if description:
        genes = genes.filter(description__icontains=description)

    genes = genes.order_by('gene_name', 'gene_library_id')
    paginator = Paginator(genes, page_size)
    page = paginator.get_page(page_number)
    species_options = list(
        GeneLibrary.objects.exclude(species__isnull=True)
        .exclude(species='')
        .order_by('species')
        .values_list('species', flat=True)
        .distinct()
    )

    return Response({
        'total': paginator.count,
        'page': page.number,
        'page_size': page_size,
        'total_pages': paginator.num_pages,
        'species': species_options,
        'results': [
            {
                'id': gene.gene_library_id,
                'target_sequence': gene.target_sequence,
                'gene_name': gene.gene_name,
                'abbreviation': gene.abbreviation,
                'symbol': gene.symbol,
                'locus_id': gene.locus_id,
                'species': gene.species,
                'description': gene.description,
                'reference_link': gene.reference_link,
            }
            for gene in page.object_list
        ],
    })


@api_view(['POST'])
def lookup_design_prices(request):
    function_code = str(request.data.get('function_type_code') or '').strip()
    delivery_code = str(request.data.get('delivery_type_code') or '').strip()
    target_gene_code = str(request.data.get('target_gene_code') or '').strip()
    formats = request.data.get('formats') or []

    if not function_code or not delivery_code or not target_gene_code:
        return Response(
            {'error': 'Function Type, Delivery Type, and Target Gene are required.'},
            status=400,
        )
    if not isinstance(formats, list) or not formats:
        return Response({'error': 'Select at least one Format Type.'}, status=400)

    results = []

    for selection in formats:
        format_code = str(selection.get('code_id') or '').strip()
        unit_amount = str(selection.get('unit_amount') or '').strip()
        format_type = GeneDesignFormatType.objects.filter(
            code_id=format_code,
            is_active=True,
        ).first()
        option_exists = GeneDesignFormatOption.objects.filter(
            format_type=format_type,
            unit_amount=unit_amount,
            is_active=True,
        ).exists() if format_type else False
        if not format_type or not option_exists:
            return Response(
                {'error': f'Unknown Format Type or Unit Amount: {format_code} / {unit_amount}.'},
                status=400,
            )

        shelf_status = _is_design_on_shelf(request.data, format_code)
        price = lookup_design_price_rule(
            function_code,
            delivery_code,
            target_gene_code,
            format_type,
            unit_amount,
            shelf_status,
        )

        base = {
            'format_code': format_code,
            'format_name': format_type.name,
            'unit_amount': unit_amount,
            'currency': 'USD',
        }
        if not price:
            results.append({
                **base,
                'status': 'unavailable',
                'quote_only': True,
                'list_price': None,
                'discount_price': None,
                'action': 'Submit Quote',
            })
        elif price.quote_only:
            results.append({
                **base,
                'status': 'quote_only',
                'quote_only': True,
                'list_price': None,
                'discount_price': None,
                'action': 'Submit Quote',
            })
        else:
            results.append({
                **base,
                'status': 'priced',
                'quote_only': False,
                'list_price': f'{price.list_price:.2f}',
                'discount_price': (
                    f'{price.discount_price:.2f}'
                    if price.discount_price is not None
                    else None
                ),
                'action': None,
            })

    return Response({'results': results})
