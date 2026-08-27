from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def normalize_product_hierarchy(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    ProductCategory = apps.get_model('products', 'ProductCategory')
    CatalogGroup = apps.get_model('products', 'CatalogGroup')

    categories_by_external_id = {
        category.external_id: category
        for category in ProductCategory.objects.exclude(external_id__isnull=True).exclude(external_id='')
    }

    for product in Product.objects.all().iterator():
        category = product.category or categories_by_external_id.get(product.category_external_id)
        updates = {}

        if category and product.category_id != category.category_id:
            updates['category_id'] = category.category_id
        if category and product.category_external_id != category.external_id:
            updates['category_external_id'] = category.external_id

        group_name = str(product.product_group or '').strip()
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
            updates['product_group'] = group.group_name

        if updates:
            Product.objects.filter(product_id=product.product_id).update(**updates)


def clear_product_group_links(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Product.objects.update(catalog_group=None)


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0051_product_show_catalog_number'),
    ]

    operations = [
        migrations.CreateModel(
            name='CatalogGroup',
            fields=[
                ('group_id', models.AutoField(primary_key=True, serialize=False)),
                ('group_name', models.CharField(max_length=100)),
                ('normalized_name', models.SlugField(max_length=120)),
                ('description', models.TextField(blank=True, default='')),
                ('priority', models.IntegerField(default=1)),
                ('is_active', models.BooleanField(default=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='catalog_groups', to='products.productcategory')),
            ],
            options={
                'db_table': 'catalog_group',
                'ordering': ['priority', 'group_name', 'group_id'],
            },
        ),
        migrations.AddConstraint(
            model_name='cataloggroup',
            constraint=models.UniqueConstraint(fields=('category', 'normalized_name'), name='unique_catalog_group_per_category'),
        ),
        migrations.AddField(
            model_name='product',
            name='catalog_group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='products.cataloggroup'),
        ),
        migrations.RunPython(normalize_product_hierarchy, clear_product_group_links),
    ]
