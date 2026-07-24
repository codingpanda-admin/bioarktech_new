from django.db import migrations


def sync_featured_product_names(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    FeaturedProduct = apps.get_model('products', 'FeaturedProduct')

    for featured_product in FeaturedProduct.objects.all().iterator():
        product = Product.objects.filter(
            catalog_number__iexact=featured_product.catalog_number,
        ).exclude(product_name='').first()
        if product and featured_product.product_name != product.product_name:
            featured_product.product_name = product.product_name
            featured_product.save(update_fields=['product_name'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0044_remove_ghost_products'),
    ]

    operations = [
        migrations.RunPython(sync_featured_product_names, migrations.RunPython.noop),
    ]
