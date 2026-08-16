from django.db import migrations, models
from django.utils.text import slugify
import tinymce.models


def populate_catalog_group_external_ids(apps, schema_editor):
    CatalogGroup = apps.get_model('products', 'CatalogGroup')
    used_ids = set()

    for group in CatalogGroup.objects.select_related('category').order_by('group_id').iterator():
        category_type = str(group.category.product_type or '').strip().lower()
        if category_type in {'reagent', 'consumable'}:
            prefix = 'reagent'
        elif category_type == 'service':
            prefix = 'service'
        else:
            prefix = 'product'

        name_slug = slugify(str(group.group_name or '').strip()) or f'group-{group.group_id}'
        base = f'{prefix}-{name_slug}'[:160].rstrip('-')
        external_id = base
        suffix = 2
        while external_id in used_ids:
            suffix_text = f'-{suffix}'
            external_id = f'{base[:160 - len(suffix_text)].rstrip("-")}{suffix_text}'
            suffix += 1

        used_ids.add(external_id)
        CatalogGroup.objects.filter(group_id=group.group_id).update(external_id=external_id)


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0052_normalize_catalog_groups'),
    ]

    operations = [
        migrations.AddField(
            model_name='cataloggroup',
            name='external_id',
            field=models.CharField(blank=True, max_length=160, null=True),
        ),
        migrations.AddField(
            model_name='cataloggroup',
            name='summary',
            field=tinymce.models.HTMLField(blank=True, default=''),
        ),
        migrations.RunPython(populate_catalog_group_external_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='cataloggroup',
            name='external_id',
            field=models.SlugField(max_length=160, unique=True),
        ),
    ]
