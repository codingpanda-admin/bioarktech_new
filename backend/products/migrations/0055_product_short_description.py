import html
import re

from django.db import migrations, models


def populate_short_descriptions(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    for product in Product.objects.filter(short_description='').iterator():
        source = str(product.description or '')
        source = re.sub(r'<(?:br\s*/?|/(?:p|div|li|h[1-6]))\s*>', '\n', source, flags=re.IGNORECASE)
        plain_text = html.unescape(re.sub(r'<[^>]*>', ' ', source))
        short_description = next(
            (' '.join(line.split()) for line in plain_text.splitlines() if line.strip()),
            '',
        )[:500]
        if short_description:
            Product.objects.filter(pk=product.pk).update(short_description=short_description)


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0054_productcategory_summary'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='short_description',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.RunPython(populate_short_descriptions, migrations.RunPython.noop),
    ]
