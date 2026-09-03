import html
import re

from django.db import migrations, models


def populate_short_descriptions(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    for service in ServiceMode.objects.filter(short_description='').iterator():
        source = str(service.content or '')
        source = re.sub(r'<(?:br\s*/?|/(?:p|div|li|h[1-6]))\s*>', '\n', source, flags=re.IGNORECASE)
        plain_text = html.unescape(re.sub(r'<[^>]*>', ' ', source))
        short_description = next(
            (' '.join(line.split()) for line in plain_text.splitlines() if line.strip()),
            '',
        )[:500]
        if short_description:
            ServiceMode.objects.filter(pk=service.pk).update(short_description=short_description)


class Migration(migrations.Migration):
    dependencies = [
        ('interface', '0031_normalize_service_catalog_hierarchy'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='short_description',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.RunPython(populate_short_descriptions, migrations.RunPython.noop),
    ]
