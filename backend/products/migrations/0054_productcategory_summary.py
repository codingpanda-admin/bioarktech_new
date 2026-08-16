from django.db import migrations
import tinymce.models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0053_catalog_group_external_id_summary'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcategory',
            name='summary',
            field=tinymce.models.HTMLField(blank=True, default=''),
        ),
    ]
