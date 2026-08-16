from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0050_product_discounted_prices'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='show_catalog_number',
            field=models.BooleanField(default=True),
        ),
    ]
