import re

from django.db.models import Q

from products.models import Product

from .models import GeneDesignFormatOption, GeneDesignFormatType, GeneDesignPrice


DESIGN_SKU_PATTERN = re.compile(
    r'^(?P<function>[A-Z]{2})(?P<delivery>[STLM])-'
    r'(?P<structure>[A-Z0-9]{6})-'
    r'(?P<target>[A-Z0-9#]+)-(?P<format>[KLC])$',
    re.IGNORECASE,
)
LEGACY_DESIGN_SKU_PATTERN = re.compile(
    r'^(?P<function>[A-Z]{2})(?P<delivery>[STLM])-'
    r'(?P<structure>[A-Z0-9]{6})-'
    r'(?P<target>[A-Z0-9#]+)(?P<format>[KLC])$',
    re.IGNORECASE,
)


def normalize_target_gene_code(value):
    code = str(value or '').strip()
    if code == '000000':
        return '000000'
    if code.lower() == 'xxxxxx':
        return 'xxxxxx'
    return '######' if code else ''


def normalize_catalog_identifier(value):
    return ''.join(str(value or '').split()).upper()


def build_design_sku(payload, format_code):
    function_code = str(payload.get('function_type_code') or '').strip().upper()
    delivery_code = str(payload.get('delivery_type_code') or '').strip().upper()
    target_gene_code = str(payload.get('target_gene_code') or '').strip().upper()
    structure_map = payload.get('structure_map') or {}
    structure_code = ''.join(
        str(structure_map.get(f'S{index}') or '').strip().upper()
        for index in range(1, 7)
    )
    if not function_code or not delivery_code or not target_gene_code or len(structure_code) != 6:
        return ''
    return f'{function_code}{delivery_code}-{structure_code}-{target_gene_code}-{format_code}'


def _sku_variants(match):
    function_code = match.group('function').upper()
    delivery_code = match.group('delivery').upper()
    structure_code = match.group('structure').upper()
    target_code = match.group('target').upper()
    format_code = match.group('format').lower()
    return {
        normalize_catalog_identifier(
            f'{function_code}{delivery_code}-{structure_code}-{target_code}-{format_code}'
        ),
        normalize_catalog_identifier(
            f'{function_code}{delivery_code}-{structure_code}-{target_code}{format_code}'
        ),
    }


def is_design_on_shelf(payload, format_code):
    """Resolve shelf status internally without exposing it as a user option."""
    expected_sku = normalize_catalog_identifier(build_design_sku(payload, format_code))
    match = DESIGN_SKU_PATTERN.fullmatch(expected_sku)
    if not match:
        return False
    identifiers = _sku_variants(match)
    lookup = Q()
    for identifier in identifiers:
        lookup |= Q(catalog_number__iexact=identifier) | Q(external_id__iexact=identifier)
    return Product.objects.filter(hidden=False).filter(lookup).exists()


def lookup_design_price_rule(
    function_code,
    delivery_code,
    target_gene_code,
    format_type,
    unit_amount,
    shelf_status,
):
    function_bucket = 'CD' if str(function_code).strip().upper() == 'CD' else 'Others'
    gene_bucket = normalize_target_gene_code(target_gene_code)
    rules = GeneDesignPrice.objects.filter(
        function_type_code=function_bucket,
        delivery_type_code=str(delivery_code).strip().upper(),
        format_type=format_type,
        unit_amount=str(unit_amount).strip(),
        shelf_status=bool(shelf_status),
    )
    # An exact Step 5 rule wins. Blank represents N/A and ignores Step 5.
    return (
        rules.filter(target_gene_code=gene_bucket).first()
        or rules.filter(target_gene_code='').first()
    )


def resolve_design_sku_price(sku, unit_amount):
    """Return a server-verified cart price for a Gene Design SKU, or None for a non-design SKU."""
    normalized_sku = normalize_catalog_identifier(sku)
    match = (
        DESIGN_SKU_PATTERN.fullmatch(normalized_sku)
        or LEGACY_DESIGN_SKU_PATTERN.fullmatch(normalized_sku)
    )
    if not match:
        return None

    format_code = match.group('format').lower()
    unit_amount = str(unit_amount or '').strip()
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
        return {'recognized': True, 'quote_only': True, 'price': None}

    lookup = Q()
    for identifier in _sku_variants(match):
        lookup |= Q(catalog_number__iexact=identifier) | Q(external_id__iexact=identifier)
    shelf_status = Product.objects.filter(hidden=False).filter(lookup).exists()
    price_rule = lookup_design_price_rule(
        match.group('function'),
        match.group('delivery'),
        match.group('target'),
        format_type,
        unit_amount,
        shelf_status,
    )
    if not price_rule or price_rule.quote_only:
        return {'recognized': True, 'quote_only': True, 'price': None}

    effective_price = (
        price_rule.discount_price
        if price_rule.discount_price is not None
        else price_rule.list_price
    )
    return {
        'recognized': True,
        'quote_only': False,
        'price': effective_price,
        'list_price': price_rule.list_price,
        'currency': 'USD',
    }
