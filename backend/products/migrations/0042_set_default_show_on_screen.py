from django.db import migrations

def set_show_on_screen(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Product.objects.filter(is_featured=True).update(show_on_screen=True)

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0041_product_show_on_screen'),
    ]

    operations = [
        migrations.RunPython(set_show_on_screen),
    ]
