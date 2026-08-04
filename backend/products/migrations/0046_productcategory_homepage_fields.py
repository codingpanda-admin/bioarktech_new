from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0045_sync_featured_product_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcategory',
            name='homepage_image',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='productcategory',
            name='show_on_homepage',
            field=models.BooleanField(default=False),
        ),
    ]
