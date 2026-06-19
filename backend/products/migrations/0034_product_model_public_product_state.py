import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0033_productcategory_external_id_and_product_type'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(
                    name='Product',
                ),
                migrations.CreateModel(
                    name='Product',
                    fields=[
                        ('product_id', models.BigAutoField(primary_key=True, serialize=False)),
                        ('external_id', models.CharField(max_length=100, unique=True)),
                        ('product_name', models.CharField(max_length=255)),
                        ('description', models.TextField(blank=True, null=True)),
                        ('image_url', models.TextField(blank=True, null=True)),
                        ('product_link', models.TextField(blank=True, null=True)),
                        ('category_external_id', models.CharField(blank=True, max_length=100, null=True)),
                        ('product_group', models.CharField(blank=True, max_length=100, null=True)),
                        ('source_type', models.CharField(blank=True, max_length=50, null=True)),
                        ('display_order', models.IntegerField(blank=True, null=True)),
                        ('source_created_at_ms', models.BigIntegerField(blank=True, null=True)),
                        ('source_created_at', models.DateTimeField(blank=True, null=True)),
                        ('catalog_number', models.CharField(blank=True, max_length=100, null=True)),
                        ('availability', models.CharField(blank=True, max_length=100, null=True)),
                        ('list_price', models.CharField(blank=True, max_length=100, null=True)),
                        ('price_range', models.CharField(blank=True, max_length=100, null=True)),
                        ('quote_only', models.BooleanField(default=False)),
                        ('is_featured', models.BooleanField(default=False)),
                        ('show_in_featured', models.BooleanField(default=False)),
                        ('show_in_gene_editing', models.BooleanField(default=False)),
                        ('key_features', django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), blank=True, default=list, size=None)),
                        ('options', django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), blank=True, default=list, size=None)),
                        ('option_prices', models.JSONField(blank=True, default=dict)),
                        ('storage_stability', models.TextField(blank=True, null=True)),
                        ('performance_data', models.TextField(blank=True, null=True)),
                        ('data_description', models.TextField(blank=True, null=True)),
                        ('manuals', django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), blank=True, default=list, size=None)),
                        ('manual_urls', django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), blank=True, default=list, size=None)),
                        ('images', django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), blank=True, default=list, size=None)),
                        ('store_link', models.TextField(blank=True, null=True)),
                        ('content_text', models.TextField(blank=True, null=True)),
                        ('hidden', models.BooleanField(default=False)),
                        ('raw_product', models.JSONField(blank=True, null=True)),
                        ('raw_override', models.JSONField(blank=True, null=True)),
                        ('raw_detail', models.JSONField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'db_table': 'product',
                    },
                ),
            ],
        ),
    ]
