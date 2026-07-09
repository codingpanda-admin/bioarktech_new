from django.db import migrations

def fix_product_prices(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    ProductCategory = apps.get_model('products', 'ProductCategory')

    products_data = {
        # CRISPR kits
        'custom-1759625091045': {
            'list_price': '$799',
        },
        'gep-05': {
            'product_name': 'KnockIn Kit at Safe Harbor Sites',
            'catalog_number': 'GEX-003',
            'list_price': '$1199+syn.',
            'options': ['Standard Kit', 'Pro Kit'],
            'option_prices': {'Standard Kit': '$1199+syn.', 'Pro Kit': '$1199+syn.'},
        },
        'custom-1759879837546': {
            'list_price': '$299',
        },
        'custom-1759624148236': {
            'list_price': '$799',
        },
        # Featured Products
        'fp-badm3364': {
            'product_name': 'GN15K DNA Marker (500-15000bp)',
            'catalog_number': 'BADM3364',
            'list_price': '$47.00',
            'category_external_id': 'category-1765063995229',
            'product_group': 'DNA Markers',
            'source_type': 'reagent',
            'options': ['500 μL', '2 x 500 μL', '5 x 500 μL'],
            'option_prices': {'500 μL': '$39.00', '2 x 500 μL': '$75.00', '5 x 500 μL': '$175.00'},
        },
        'fp-bsy3320': {
            'product_name': '2 × SYBR Green qPCR Master Mix',
            'catalog_number': 'BSY3320',
            'list_price': '$75.00',
            'category_external_id': 'category-1765063995229',
            'product_group': 'qPCR Reagents',
            'source_type': 'reagent',
            'options': ['1 mL (None ROX)', '1 mL (Low ROX)', '1 mL (High ROX)'],
            'option_prices': {
                '1 mL (None ROX)': '$75.00',
                '1 mL (Low ROX)': '$75.00',
                '1 mL (High ROX)': '$75.00',
            },
        },
        'fp-bsy3323': {
            'product_name': '2 × Fast SYBR Green qPCR Master Mix',
            'catalog_number': 'BSY3323',
            'list_price': '$75.00',
            'category_external_id': 'category-1765063995229',
            'product_group': 'qPCR Reagents',
            'source_type': 'reagent',
            'options': ['1 mL (None ROX)', '1 mL (Low ROX)', '1 mL (High ROX)'],
            'option_prices': {
                '1 mL (None ROX)': '$75.00',
                '1 mL (Low ROX)': '$75.00',
                '1 mL (High ROX)': '$75.00',
            },
        },
        'fp-bal100688': {
            'product_name': 'BAPoly® In Vitro DNA Transfection Reagent',
            'catalog_number': 'BAL100688',
            'list_price': '$23.00',
            'category_external_id': 'category-1765995504911',
            'product_group': 'Transfection Reagents',
            'source_type': 'reagent',
            'options': ['0.1 mL', '0.5 mL', '1.0 mL', '7 x 1.0 mL'],
            'option_prices': {
                '0.1 mL': '$20.00',
                '0.5 mL': '$65.00',
                '1.0 mL': '$120.00',
                '7 x 1.0 mL': '$610.00',
            },
        },
        'fp-badm3362': {
            'product_name': 'GN8K DNA Marker (100-8000bp)',
            'catalog_number': 'BADM3362',
            'list_price': '$47.00',
            'category_external_id': 'category-1765063995229',
            'product_group': 'DNA Markers',
            'source_type': 'reagent',
            'options': ['500 μL', '2 x 500 μL', '5 x 500 μL'],
            'option_prices': {'500 μL': '$39.00', '2 x 500 μL': '$75.00', '5 x 500 μL': '$175.00'},
        },
        'fp-bal100468': {
            'product_name': 'BioArkLipo® In Vitro Transfection Kit (Ver. II)',
            'catalog_number': 'BAL100468',
            'list_price': '$40.00',
            'category_external_id': 'category-1765995504911',
            'product_group': 'Transfection Reagents',
            'source_type': 'reagent',
            'options': ['0.1 mL', '0.5 mL', '1.0 mL', '6 x 1.0 mL'],
            'option_prices': {
                '0.1 mL': '$35.00',
                '0.5 mL': '$188.00',
                '1.0 mL': '$320.00',
                '6 x 1.0 mL': '$1600.00',
            },
        },
        'fp-badm3363': {
            'product_name': 'GN10K DNA Marker (300-10000bp)',
            'catalog_number': 'BADM3363',
            'list_price': '$47.00',
            'category_external_id': 'category-1765063995229',
            'product_group': 'DNA Markers',
            'source_type': 'reagent',
            'options': ['500 μL', '2 x 500 μL', '5 x 500 μL'],
            'option_prices': {'500 μL': '$39.00', '2 x 500 μL': '$75.00', '5 x 500 μL': '$175.00'},
        },
        'fp-bapm2083': {
            'product_name': 'Prestained Protein Marker IV (8-200 kDa)',
            'catalog_number': 'BAPM2083',
            'list_price': '$59.00',
            'category_external_id': 'category-1766675365489',
            'product_group': 'Protein Markers',
            'source_type': 'reagent',
            'options': ['250 μL', '2 x 250 μL', '3 x 250 μL'],
            'option_prices': {'250 μL': '$48.00', '2 x 250 μL': '$91.00', '3 x 250 μL': '$139.00'},
        },
        'fp-bal100668': {
            'product_name': 'BAJet® In Vitro DNA Transfection Reagent',
            'catalog_number': 'BAL100668',
            'list_price': '$26.00',
            'category_external_id': 'category-1765995504911',
            'product_group': 'Transfection Reagents',
            'source_type': 'reagent',
            'options': ['0.1 mL', '0.5 mL', '1.0 mL', '5 x 1.0 mL'],
            'option_prices': {
                '0.1 mL': '$21.00',
                '0.5 mL': '$89.00',
                '1.0 mL': '$170.00',
                '5 x 1.0 mL': '$701.00',
            },
        },
        'fp-bapm2086': {
            'product_name': 'Western Protein Marker I (Exposure)',
            'catalog_number': 'BAPM2086',
            'list_price': '$59.00',
            'category_external_id': 'category-1766675365489',
            'product_group': 'Protein Markers',
            'source_type': 'reagent',
            'options': ['250 μL', '2 × 250 μL', '3 × 250 μL'],
            'option_prices': {'250 μL': '$48.00', '2 × 250 μL': '$91.00', '3 × 250 μL': '$139.00'},
        },
    }

    junk_ids = [
        'custom-1757608878053', 'custom-1757609198384', 'custom-1757746922797', 
        'custom-1757747120684', 'custom-1757747406537', 'custom-1757747796374', 
        'custom-1762801437711', 'custom-1762801582044', 'custom-1762801601793', 
        'custom-1762801947809', 'custom-1762803603192', 'custom-1764990947079'
    ]

    # Update real products
    for ext_id, fields in products_data.items():
        Product.objects.filter(external_id=ext_id).update(**fields)
        # Handle category ForeignKey mapping manually if category_external_id was set
        if 'category_external_id' in fields:
            cat_obj = ProductCategory.objects.filter(external_id=fields['category_external_id']).first()
            if cat_obj:
                Product.objects.filter(external_id=ext_id).update(category=cat_obj)

    # Hide junk configurations
    Product.objects.filter(external_id__in=junk_ids).update(hidden=True)

def reverse_fix_product_prices(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    
    junk_ids = [
        'custom-1757608878053', 'custom-1757609198384', 'custom-1757746922797', 
        'custom-1757747120684', 'custom-1757747406537', 'custom-1757747796374', 
        'custom-1762801437711', 'custom-1762801582044', 'custom-1762801601793', 
        'custom-1762801947809', 'custom-1762803603192', 'custom-1764990947079'
    ]
    
    real_ids = [
        'custom-1759625091045', 'gep-05', 'custom-1759879837546', 'custom-1759624148236',
        'fp-badm3364', 'fp-bsy3320', 'fp-bsy3323', 'fp-bal100688', 'fp-badm3362',
        'fp-bal100468', 'fp-badm3363', 'fp-bapm2083', 'fp-bal100668', 'fp-bapm2086'
    ]

    Product.objects.filter(external_id__in=real_ids).update(
        list_price='', 
        options=[], 
        option_prices={}
    )
    
    Product.objects.filter(external_id__in=junk_ids).update(hidden=False)

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0042_set_default_show_on_screen'),
    ]

    operations = [
        migrations.RunPython(fix_product_prices, reverse_fix_product_prices),
    ]
