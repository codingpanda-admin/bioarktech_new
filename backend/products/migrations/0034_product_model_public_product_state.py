import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0033_productcategory_external_id_and_product_type'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    CREATE TABLE IF NOT EXISTS public.product (
                        product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                        external_id VARCHAR(100) NOT NULL UNIQUE,
                        product_name VARCHAR(255) NOT NULL,
                        description TEXT,
                        image_url TEXT,
                        product_link TEXT,
                        category_external_id VARCHAR(100),
                        product_group VARCHAR(100),
                        source_type VARCHAR(50),
                        display_order INTEGER,
                        source_created_at_ms BIGINT,
                        source_created_at TIMESTAMPTZ,
                        catalog_number VARCHAR(100),
                        availability VARCHAR(100),
                        list_price VARCHAR(100),
                        price_range VARCHAR(100),
                        quote_only BOOLEAN NOT NULL DEFAULT FALSE,
                        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
                        show_in_featured BOOLEAN NOT NULL DEFAULT FALSE,
                        show_in_gene_editing BOOLEAN NOT NULL DEFAULT FALSE,
                        key_features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                        options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                        option_prices JSONB NOT NULL DEFAULT '{}'::JSONB,
                        storage_stability TEXT,
                        performance_data TEXT,
                        data_description TEXT,
                        manuals TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                        manual_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                        images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                        store_link TEXT,
                        content_text TEXT,
                        hidden BOOLEAN NOT NULL DEFAULT FALSE,
                        raw_product JSONB,
                        raw_override JSONB,
                        raw_detail JSONB,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS idx_product_category_external_id ON public.product (category_external_id);
                    CREATE INDEX IF NOT EXISTS idx_product_display_order ON public.product (display_order);
                    CREATE INDEX IF NOT EXISTS idx_product_catalog_number ON public.product (catalog_number);
                    CREATE INDEX IF NOT EXISTS idx_product_show_in_featured ON public.product (show_in_featured) WHERE show_in_featured = TRUE;
                    """,
                    reverse_sql="DROP TABLE IF EXISTS public.product;"
                )
            ],
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
