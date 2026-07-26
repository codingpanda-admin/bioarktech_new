from django.db import migrations


REAGENT_CATEGORY_IDS = [
    'category-1765063995229',
    'category-1766675380397',
    'category-1766675365489',
    'category-1765995504911',
]
CONSUMABLE_CATEGORY_ID = 'category-1780539818236'


def correct_reagent_classification(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    ProductCategory = apps.get_model('products', 'ProductCategory')

    ProductCategory.objects.filter(
        external_id__in=REAGENT_CATEGORY_IDS
    ).update(product_type='reagent')
    ProductCategory.objects.filter(
        external_id=CONSUMABLE_CATEGORY_ID
    ).update(product_type='consumable')

    Product.objects.filter(
        category_external_id__in=[*REAGENT_CATEGORY_IDS, CONSUMABLE_CATEGORY_ID]
    ).update(source_type='reagent')


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0047_merge_product_migration_branches'),
    ]

    operations = [
        migrations.RunPython(correct_reagent_classification, migrations.RunPython.noop),
    ]
