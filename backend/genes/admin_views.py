from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    GeneDesignDeliveryType,
    GeneDesignFormatOption,
    GeneDesignFormatType,
    GeneDesignPrice,
    GeneLibrary,
)


def _check_admin(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    if not (getattr(request.user, 'is_admin', False) or request.user.is_staff):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    return None


def _page_number(request):
    try:
        return max(1, int(request.query_params.get('page', 1)))
    except (TypeError, ValueError):
        return 1


def _page_size(request):
    try:
        return min(100, max(10, int(request.query_params.get('page_size', 50))))
    except (TypeError, ValueError):
        return 50


def _validation_message(exc):
    if hasattr(exc, 'message_dict'):
        return ' '.join(
            f'{field}: {" ".join(messages)}'
            for field, messages in exc.message_dict.items()
        )
    return ' '.join(exc.messages) if getattr(exc, 'messages', None) else str(exc)


def _serialize_gene(gene):
    return {
        'id': gene.gene_library_id,
        'target_sequence': gene.target_sequence,
        'gene_name': gene.gene_name,
        'abbreviation': gene.abbreviation or '',
        'symbol': gene.symbol,
        'locus_id': gene.locus_id,
        'species': gene.species or '',
        'description': gene.description or '',
        'reference_link': gene.reference_link or '',
    }


def _gene_values(data):
    target_sequence = str(data.get('target_sequence') or '').strip().upper()
    gene_name = str(data.get('gene_name') or '').strip()
    symbol = str(data.get('symbol') or '').strip()
    if not target_sequence or not gene_name or not symbol:
        raise ValidationError('Target Sequence, Gene Name, and Symbol are required.')
    if len(target_sequence) > 6:
        raise ValidationError('Target Sequence cannot exceed 6 characters.')

    locus_text = str(data.get('locus_id') or '').strip()
    try:
        locus_id = int(locus_text) if locus_text else None
    except ValueError as exc:
        raise ValidationError('Locus ID must be a whole number.') from exc

    return {
        'target_sequence': target_sequence,
        'gene_name': gene_name,
        'abbreviation': str(data.get('abbreviation') or '').strip() or None,
        'symbol': symbol,
        'locus_id': locus_id,
        'species': str(data.get('species') or '').strip() or None,
        'description': str(data.get('description') or '').strip() or None,
        'reference_link': str(data.get('reference_link') or '').strip() or None,
    }


@api_view(['GET'])
def admin_list_genes(request):
    err = _check_admin(request)
    if err:
        return err

    query = str(request.query_params.get('q') or '').strip()
    species = str(request.query_params.get('species') or '').strip()
    genes = GeneLibrary.objects.all()
    if query:
        search = (
            Q(target_sequence__icontains=query)
            | Q(gene_name__icontains=query)
            | Q(symbol__icontains=query)
            | Q(abbreviation__icontains=query)
            | Q(description__icontains=query)
        )
        if query.isdigit():
            search |= Q(locus_id=int(query))
        genes = genes.filter(search)
    if species:
        genes = genes.filter(species__iexact=species)

    genes = genes.order_by('gene_name', 'target_sequence', 'gene_library_id')
    paginator = Paginator(genes, _page_size(request))
    page = paginator.get_page(_page_number(request))
    species_options = list(
        GeneLibrary.objects.exclude(species__isnull=True)
        .exclude(species='')
        .order_by('species')
        .values_list('species', flat=True)
        .distinct()
    )
    return Response({
        'results': [_serialize_gene(gene) for gene in page.object_list],
        'total': paginator.count,
        'page': page.number,
        'page_size': paginator.per_page,
        'total_pages': paginator.num_pages,
        'species': species_options,
    })


@api_view(['POST'])
def admin_create_gene(request):
    err = _check_admin(request)
    if err:
        return err
    try:
        values = _gene_values(request.data)
        if GeneLibrary.objects.filter(target_sequence__iexact=values['target_sequence']).exists():
            raise ValidationError('A gene with this Target Sequence already exists.')
        gene = GeneLibrary.objects.create(**values)
        return Response({'gene': _serialize_gene(gene)}, status=status.HTTP_201_CREATED)
    except ValidationError as exc:
        return Response({'error': _validation_message(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_update_gene(request, gene_id):
    err = _check_admin(request)
    if err:
        return err
    try:
        gene = GeneLibrary.objects.get(gene_library_id=gene_id)
    except GeneLibrary.DoesNotExist:
        return Response({'error': 'Gene record not found.'}, status=status.HTTP_404_NOT_FOUND)
    try:
        values = _gene_values(request.data)
        duplicate = GeneLibrary.objects.filter(
            target_sequence__iexact=values['target_sequence'],
        ).exclude(gene_library_id=gene_id).exists()
        if duplicate:
            raise ValidationError('A gene with this Target Sequence already exists.')
        for field, value in values.items():
            setattr(gene, field, value)
        gene.save()
        return Response({'gene': _serialize_gene(gene)})
    except ValidationError as exc:
        return Response({'error': _validation_message(exc)}, status=status.HTTP_400_BAD_REQUEST)


def _serialize_price(price):
    return {
        'id': price.id,
        'function_type_code': price.function_type_code,
        'delivery_type_code': price.delivery_type_code,
        'target_gene_code': price.target_gene_code,
        'format_type_id': price.format_type_id,
        'format_code': price.format_type.code_id,
        'format_name': price.format_type.name,
        'unit_amount': price.unit_amount,
        'shelf_status': price.shelf_status,
        'unit_label': price.unit_label,
        'quote_only': price.quote_only,
        'currency': price.currency,
        'list_price': f'{price.list_price:.2f}' if price.list_price is not None else '',
        'discount_price': f'{price.discount_price:.2f}' if price.discount_price is not None else '',
    }


def _price_metadata():
    format_types = GeneDesignFormatType.objects.prefetch_related('options').order_by(
        'display_order', 'id'
    )
    return {
        'function_types': [
            {'code': 'Others', 'name': 'Others (all Step 2 codes except CD)'},
            {'code': 'CD', 'name': 'CD'},
        ],
        'delivery_types': [
            {'code': item.symbol_id, 'name': item.name}
            for item in GeneDesignDeliveryType.objects.filter(is_active=True).order_by('display_order', 'id')
        ],
        'format_types': [
            {
                'id': item.id,
                'code': item.code_id,
                'name': item.name,
                'options': [
                    option.unit_amount
                    for option in item.options.filter(is_active=True).order_by('display_order', 'id')
                ],
            }
            for item in format_types
        ],
    }


def _bool_value(value):
    if isinstance(value, bool):
        return value
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'y', 'on'}


def _decimal_value(value, label, required=False):
    text = str(value or '').replace('$', '').replace(',', '').strip()
    if not text:
        if required:
            raise ValidationError(f'{label} is required.')
        return None
    try:
        amount = Decimal(text)
    except InvalidOperation as exc:
        raise ValidationError(f'{label} must be a valid US dollar amount.') from exc
    if not amount.is_finite() or amount < 0:
        raise ValidationError(f'{label} must be zero or greater.')
    return amount


def _price_values(data):
    function_code = str(data.get('function_type_code') or '').strip()
    delivery_code = str(data.get('delivery_type_code') or '').strip().upper()
    target_gene_code = str(data.get('target_gene_code') or '').strip()
    unit_amount = str(data.get('unit_amount') or '').strip()
    unit_label = str(data.get('unit_label') or 'Kit').strip() or 'Kit'
    quote_only = _bool_value(data.get('quote_only'))
    shelf_status = _bool_value(data.get('shelf_status'))

    if function_code not in {'Others', 'CD'}:
        raise ValidationError('Function Type must be Others or CD.')
    if not GeneDesignDeliveryType.objects.filter(symbol_id=delivery_code, is_active=True).exists():
        raise ValidationError('Select a valid active Delivery Type.')
    try:
        format_type_id = int(data.get('format_type_id'))
        format_type = GeneDesignFormatType.objects.get(id=format_type_id, is_active=True)
    except (TypeError, ValueError, GeneDesignFormatType.DoesNotExist) as exc:
        raise ValidationError('Select a valid active Format Type.') from exc
    if not GeneDesignFormatOption.objects.filter(
        format_type=format_type,
        unit_amount=unit_amount,
        is_active=True,
    ).exists():
        raise ValidationError('Select a Unit Amount belonging to the chosen Format Type.')
    if target_gene_code not in {'', '000000', 'xxxxxx', '######'}:
        raise ValidationError('Step 5 Code must be N/A, 000000, xxxxxx, or ######.')

    return {
        'function_type_code': function_code,
        'delivery_type_code': delivery_code,
        'target_gene_code': target_gene_code,
        'format_type': format_type,
        'unit_amount': unit_amount,
        'shelf_status': shelf_status,
        'unit_label': unit_label,
        'quote_only': quote_only,
        'currency': 'USD',
        'list_price': _decimal_value(data.get('list_price'), 'List Price', required=not quote_only),
        'discount_price': _decimal_value(data.get('discount_price'), 'Discount Price'),
    }


@api_view(['GET'])
def admin_list_gene_design_prices(request):
    err = _check_admin(request)
    if err:
        return err

    prices = GeneDesignPrice.objects.select_related('format_type')
    function_code = str(request.query_params.get('function_type') or '').strip()
    delivery_code = str(request.query_params.get('delivery_type') or '').strip()
    format_code = str(request.query_params.get('format_type') or '').strip()
    query = str(request.query_params.get('q') or '').strip()
    if function_code:
        prices = prices.filter(function_type_code=function_code)
    if delivery_code:
        prices = prices.filter(delivery_type_code=delivery_code)
    if format_code:
        prices = prices.filter(format_type__code_id=format_code)
    if query:
        prices = prices.filter(
            Q(target_gene_code__icontains=query)
            | Q(unit_amount__icontains=query)
            | Q(unit_label__icontains=query)
            | Q(format_type__name__icontains=query)
        )

    prices = prices.order_by(
        'function_type_code', 'delivery_type_code', 'format_type__display_order',
        'unit_amount', 'target_gene_code', 'shelf_status', 'id',
    )
    paginator = Paginator(prices, _page_size(request))
    page = paginator.get_page(_page_number(request))
    return Response({
        'results': [_serialize_price(price) for price in page.object_list],
        'total': paginator.count,
        'page': page.number,
        'page_size': paginator.per_page,
        'total_pages': paginator.num_pages,
        'metadata': _price_metadata(),
    })


def _save_price(request, price=None):
    try:
        values = _price_values(request.data)
        is_new = price is None
        with transaction.atomic():
            price = price or GeneDesignPrice()
            for field, value in values.items():
                setattr(price, field, value)
            price.save()
        return Response(
            {'price': _serialize_price(price)},
            status=status.HTTP_201_CREATED if is_new else status.HTTP_200_OK,
        )
    except ValidationError as exc:
        return Response({'error': _validation_message(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except IntegrityError:
        return Response(
            {'error': 'A pricing record already exists for this exact lookup combination.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['POST'])
def admin_create_gene_design_price(request):
    err = _check_admin(request)
    if err:
        return err
    return _save_price(request)


@api_view(['POST'])
def admin_update_gene_design_price(request, price_id):
    err = _check_admin(request)
    if err:
        return err
    try:
        price = GeneDesignPrice.objects.select_related('format_type').get(id=price_id)
    except GeneDesignPrice.DoesNotExist:
        return Response({'error': 'Pricing record not found.'}, status=status.HTTP_404_NOT_FOUND)
    return _save_price(request, price)
