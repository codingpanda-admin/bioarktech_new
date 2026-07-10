from django.db import migrations

def remove_ghost_products(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    ghost_ids = [
        'custom-1757748063327', 'custom-1757608878053', 'custom-1757609198384', 
        'custom-1757746922797', 'custom-1757747120684', 'custom-1757747406537', 
        'custom-1757747796374', 'custom-1762801437711', 'custom-1762801582044', 
        'custom-1762801601793', 'custom-1762801947809', 'custom-1762803603192', 
        'custom-1764990947079'
    ]
    Product.objects.filter(external_id__in=ghost_ids).delete()

def reverse_remove_ghost_products(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0043_fix_product_prices'),
    ]

    operations = [
        migrations.RunPython(remove_ghost_products, reverse_remove_ghost_products),
    ]
