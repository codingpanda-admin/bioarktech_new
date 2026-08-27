from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0049_product_videos'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='discounted_price',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='option_discounted_prices',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
