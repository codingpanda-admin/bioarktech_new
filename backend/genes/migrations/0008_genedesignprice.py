from decimal import Decimal

from django.db import migrations, models
import django.db.models.deletion


def seed_gene_design_prices(apps, schema_editor):
    GeneDesignFormatOption = apps.get_model('genes', 'GeneDesignFormatOption')
    GeneDesignFormatType = apps.get_model('genes', 'GeneDesignFormatType')
    GeneDesignPrice = apps.get_model('genes', 'GeneDesignPrice')

    format_types = {
        item.code_id: item
        for item in GeneDesignFormatType.objects.filter(code_id__in=['k', 'l', 'c'])
    }

    vector = format_types['k']
    GeneDesignFormatOption.objects.filter(
        format_type=vector,
        unit_amount='5ug',
    ).update(unit_amount='5ug DNA', display_order=1)
    GeneDesignFormatOption.objects.update_or_create(
        format_type=vector,
        unit_amount='5ug each/3 tubes',
        defaults={'display_order': 2, 'is_active': True},
    )
    GeneDesignFormatOption.objects.filter(
        format_type=vector,
        unit_amount='5ug each/3 tubes plus control',
    ).update(display_order=3, is_active=True)

    def add(
        function_code,
        delivery_code,
        gene_code,
        format_code,
        shelf_status,
        unit_amount,
        list_price=None,
        discount_price=None,
        quote_only=False,
    ):
        GeneDesignPrice.objects.update_or_create(
            function_type_code=function_code,
            delivery_type_code=delivery_code,
            target_gene_code=gene_code,
            format_type=format_types[format_code],
            unit_amount=unit_amount,
            shelf_status=shelf_status,
            defaults={
                'unit_label': 'Kit',
                'quote_only': quote_only,
                'currency': 'USD',
                'list_price': Decimal(str(list_price)) if list_price is not None else None,
                'discount_price': Decimal(str(discount_price)) if discount_price is not None else None,
            },
        )

    # Function Type values other than CD use the shared "Others" bucket.
    vector_custom = {
        'S': {'base': ('399.00', '198.50'), 'gene': ('799.00', '398.50')},
        'L': {'base': ('399.00', '198.50'), 'gene': ('799.00', '398.50')},
        'M': {'base': ('499.00', '248.50'), 'gene': ('999.00', '498.50')},
        'T': {'base': ('499.00', '248.50'), 'gene': ('999.00', '498.50')},
    }
    for delivery_code, prices in vector_custom.items():
        for gene_code in ['xxxxxx', '000000']:
            add('Others', delivery_code, gene_code, 'k', False, '5ug DNA', *prices['base'])
            add('Others', delivery_code, gene_code, 'k', True, '5ug DNA', '249.00', '123.50')
        add(
            'Others', delivery_code, '######', 'k', False,
            '5ug each/3 tubes', *prices['gene'],
        )
        add(
            'Others', delivery_code, '######', 'k', True,
            '5ug each/3 tubes', '599.00', '298.50',
        )

    lentivirus_custom = {
        '1X10^7 IU/ml': {'control': ('199.00', '199.00'), 'gene': ('249.00', '249.00')},
        '1X10^8 IU/ml': {'control': ('399.00', '399.00'), 'gene': ('549.00', '549.00')},
        '1X10^9 IU/ml': {'control': ('699.00', '699.00'), 'gene': ('749.00', '749.00')},
    }
    for delivery_code in ['L', 'M']:
        for unit_amount, prices in lentivirus_custom.items():
            add('Others', delivery_code, '000000', 'l', False, unit_amount, *prices['control'])
            add('Others', delivery_code, '######', 'l', False, unit_amount, *prices['gene'])
            add('Others', delivery_code, '000000', 'l', True, unit_amount, '180.00', '180.00')
            add('Others', delivery_code, '######', 'l', True, unit_amount, '280.00', '280.00')

    cell_custom_prices = {'S': '4520.00', 'L': '4520.00', 'M': '5570.00', 'T': '5570.00'}
    for delivery_code, list_price in cell_custom_prices.items():
        add('Others', delivery_code, '######', 'c', False, '1X10^6 Cells', list_price, list_price)
        add('Others', delivery_code, '######', 'c', True, '1X10^6 Cells', '545.00', '545.00')

    # CD has its own pricing bucket.
    add('CD', 'S', '000000', 'k', False, '5ug DNA', '266.00', '132.00')
    add('CD', 'S', '######', 'k', False, '5ug each/3 tubes plus control', '532.67', '265.33')
    add('CD', 'S', '000000', 'k', True, '5ug DNA', '166.00', '82.00')
    add('CD', 'S', '######', 'k', True, '5ug each/3 tubes plus control', '399.33', '198.67')

    # Blank target_gene_code represents N/A: Step 5 is ignored for these rules.
    for delivery_code in ['L', 'T']:
        for unit_amount in ['1X10^7 IU/ml', '1X10^8 IU/ml', '1X10^9 IU/ml']:
            add('CD', delivery_code, '', 'l', False, unit_amount, quote_only=True)
            add('CD', delivery_code, '', 'l', True, unit_amount, quote_only=True)

    for delivery_code in ['S', 'M', 'L', 'T']:
        add('CD', delivery_code, '######', 'c', False, '1X10^6 Cells', quote_only=True)
        add('CD', delivery_code, '######', 'c', True, '1X10^6 Cells', quote_only=True)


def remove_gene_design_prices(apps, schema_editor):
    GeneDesignFormatOption = apps.get_model('genes', 'GeneDesignFormatOption')
    GeneDesignFormatType = apps.get_model('genes', 'GeneDesignFormatType')
    GeneDesignPrice = apps.get_model('genes', 'GeneDesignPrice')

    GeneDesignPrice.objects.all().delete()
    vector = GeneDesignFormatType.objects.filter(code_id='k').first()
    if vector:
        GeneDesignFormatOption.objects.filter(
            format_type=vector,
            unit_amount='5ug each/3 tubes',
        ).delete()
        GeneDesignFormatOption.objects.filter(
            format_type=vector,
            unit_amount='5ug DNA',
        ).update(unit_amount='5ug', display_order=1)
        GeneDesignFormatOption.objects.filter(
            format_type=vector,
            unit_amount='5ug each/3 tubes plus control',
        ).update(display_order=2)


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0007_genedesignformattype_and_option'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignPrice',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('function_type_code', models.CharField(max_length=20)),
                ('delivery_type_code', models.CharField(max_length=10)),
                ('target_gene_code', models.CharField(blank=True, default='', max_length=20)),
                ('unit_amount', models.CharField(max_length=100)),
                ('shelf_status', models.BooleanField(default=False)),
                ('unit_label', models.CharField(default='Kit', max_length=30)),
                ('quote_only', models.BooleanField(default=False)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('list_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('discount_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'format_type',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='price_rules',
                        to='genes.genedesignformattype',
                    ),
                ),
            ],
            options={
                'db_table': 'gene_design_price',
                'ordering': [
                    'function_type_code',
                    'delivery_type_code',
                    'format_type_id',
                    'unit_amount',
                    'target_gene_code',
                    'shelf_status',
                ],
            },
        ),
        migrations.AddConstraint(
            model_name='genedesignprice',
            constraint=models.UniqueConstraint(
                fields=(
                    'function_type_code',
                    'delivery_type_code',
                    'target_gene_code',
                    'format_type',
                    'unit_amount',
                    'shelf_status',
                ),
                name='gene_design_price_lookup_uniq',
            ),
        ),
        migrations.AddIndex(
            model_name='genedesignprice',
            index=models.Index(
                fields=[
                    'function_type_code',
                    'delivery_type_code',
                    'format_type',
                    'unit_amount',
                    'shelf_status',
                ],
                name='gene_design_price_lookup_idx',
            ),
        ),
        migrations.RunPython(seed_gene_design_prices, remove_gene_design_prices),
    ]
