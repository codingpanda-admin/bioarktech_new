from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def normalize_service_hierarchy(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    ProductCategory = apps.get_model('products', 'ProductCategory')
    CatalogGroup = apps.get_model('products', 'CatalogGroup')

    categories_by_external_id = {
        category.external_id: category
        for category in ProductCategory.objects.exclude(external_id__isnull=True).exclude(external_id='')
    }

    for service in ServiceMode.objects.all().iterator():
        category = categories_by_external_id.get(service.category)
        updates = {}

        if category:
            updates['category_ref_id'] = category.category_id
            updates['category'] = category.external_id

        group_name = str(service.service_group or '').strip()
        normalized_name = slugify(group_name)[:120]
        if category and normalized_name:
            group, _ = CatalogGroup.objects.get_or_create(
                category_id=category.category_id,
                normalized_name=normalized_name,
                defaults={
                    'group_name': group_name,
                    'priority': 1,
                    'is_active': True,
                },
            )
            updates['catalog_group_id'] = group.group_id
            updates['service_group'] = group.group_name

        if updates:
            ServiceMode.objects.filter(id=service.id).update(**updates)


def clear_service_hierarchy_links(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    ServiceMode.objects.update(category_ref=None, catalog_group=None)


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0052_normalize_catalog_groups'),
        ('interface', '0030_servicemode_presented_service'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='category_ref',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='services', to='products.productcategory'),
        ),
        migrations.AddField(
            model_name='servicemode',
            name='catalog_group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='services', to='products.cataloggroup'),
        ),
        migrations.RunPython(normalize_service_hierarchy, clear_service_hierarchy_links),
    ]
