import tinymce.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0026_servicemode_videos'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='technique',
            field=tinymce.models.HTMLField(blank=True, default=''),
        ),
    ]
