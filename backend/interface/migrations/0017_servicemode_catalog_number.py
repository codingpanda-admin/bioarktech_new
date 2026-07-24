import re

from django.db import migrations, models


CATALOG_NUMBER_PATTERN = re.compile(r'\(([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)\)\s*$')


def populate_catalog_numbers(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    for service in ServiceMode.objects.all().only('id', 'title'):
        match = CATALOG_NUMBER_PATTERN.search(service.title or '')
        if match:
            ServiceMode.objects.filter(id=service.id).update(catalog_number=match.group(1))


def clear_catalog_numbers(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    ServiceMode.objects.update(catalog_number=None)


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0016_servicemode_service_group'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='catalog_number',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.RunPython(populate_catalog_numbers, clear_catalog_numbers),
    ]
