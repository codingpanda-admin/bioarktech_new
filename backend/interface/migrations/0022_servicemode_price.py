import tinymce.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0021_restore_service_groups'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='price',
            field=tinymce.models.HTMLField(blank=True, default=''),
        ),
    ]
