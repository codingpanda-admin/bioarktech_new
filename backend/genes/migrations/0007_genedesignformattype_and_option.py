from django.db import migrations, models
import django.db.models.deletion


FORMAT_TYPES = [
    {
        'code_id': 'k',
        'name': 'Vector',
        'description': (
            'The products are provided as a kit containing all the essential '
            'components for convenient use in your experiments. For '
            'CRISPR/RNAi targeting a specific gene, three distinct gRNAs/shRNAs '
            'are designed to target the specified genes or RNAs, with a '
            'scramble tube included as a control. If ordering only a '
            'CRISPR/RNAi control, non-insert vector, overexpression or inducible '
            'expression, the corresponding tube is included in the kit.'
        ),
        'shipping_temperature': 'Room Temp',
        'storage': '4C',
        'stability': '>5 year',
        'display_order': 1,
    },
    {
        'code_id': 'l',
        'name': 'Lentivirus',
        'description': (
            'The product is provided as lentivirus at titers specified by the '
            'customer, with three available options: 1x10^7, 1x10^8, and '
            '1x10^9 TU/mL. For CRISPR/RNAi targeting a specific gene, three '
            'DNA constructs are combined to create the lentiviral mixture, '
            'with a separate scramble tube included as a control. If ordering '
            'only a CRISPR/RNAi control, overexpression or inducible '
            'expression, the corresponding tube is included in the package.'
        ),
        'shipping_temperature': 'ice Package',
        'storage': 'Temp -20 to -80',
        'stability': '1 year',
        'display_order': 2,
    },
    {
        'code_id': 'c',
        'name': 'Cell',
        'description': (
            'The constructed stable cell line is provided as frozen cells in '
            'quantities specified by the customer.'
        ),
        'shipping_temperature': 'Dry ice',
        'storage': '-80',
        'stability': '1 year',
        'display_order': 3,
    },
]


FORMAT_OPTIONS = [
    {'format_code': 'k', 'unit_amount': '5ug', 'display_order': 1},
    {
        'format_code': 'k',
        'unit_amount': '5ug each/3 tubes plus control',
        'display_order': 2,
    },
    {'format_code': 'l', 'unit_amount': '1X10^7 IU/ml', 'display_order': 1},
    {'format_code': 'l', 'unit_amount': '1X10^8 IU/ml', 'display_order': 2},
    {'format_code': 'l', 'unit_amount': '1X10^9 IU/ml', 'display_order': 3},
    {'format_code': 'c', 'unit_amount': '1X10^6 Cells', 'display_order': 1},
]


def seed_gene_design_format_types(apps, schema_editor):
    GeneDesignFormatType = apps.get_model('genes', 'GeneDesignFormatType')
    GeneDesignFormatOption = apps.get_model('genes', 'GeneDesignFormatOption')

    format_types = {}
    for format_type in FORMAT_TYPES:
        record, _ = GeneDesignFormatType.objects.update_or_create(
            code_id=format_type['code_id'],
            defaults={
                'name': format_type['name'],
                'description': format_type['description'],
                'shipping_temperature': format_type['shipping_temperature'],
                'storage': format_type['storage'],
                'stability': format_type['stability'],
                'display_order': format_type['display_order'],
                'is_active': True,
            },
        )
        format_types[format_type['code_id']] = record

    for option in FORMAT_OPTIONS:
        GeneDesignFormatOption.objects.update_or_create(
            format_type=format_types[option['format_code']],
            unit_amount=option['unit_amount'],
            defaults={
                'display_order': option['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_gene_design_format_types(apps, schema_editor):
    GeneDesignFormatType = apps.get_model('genes', 'GeneDesignFormatType')
    GeneDesignFormatOption = apps.get_model('genes', 'GeneDesignFormatOption')
    seeded_types = GeneDesignFormatType.objects.filter(
        code_id__in=[format_type['code_id'] for format_type in FORMAT_TYPES]
    )
    GeneDesignFormatOption.objects.filter(format_type__in=seeded_types).delete()
    seeded_types.delete()


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0006_genedesigntargetgeneoption'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignFormatType',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('code_id', models.CharField(max_length=10, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('shipping_temperature', models.CharField(max_length=100)),
                ('storage', models.CharField(max_length=100)),
                ('stability', models.CharField(max_length=100)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'gene_design_format_type',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='GeneDesignFormatOption',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('unit_amount', models.CharField(max_length=100)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'format_type',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='options',
                        to='genes.genedesignformattype',
                    ),
                ),
            ],
            options={
                'db_table': 'gene_design_format_option',
                'ordering': ['format_type_id', 'display_order', 'id'],
            },
        ),
        migrations.AddConstraint(
            model_name='genedesignformatoption',
            constraint=models.UniqueConstraint(
                fields=('format_type', 'unit_amount'),
                name='gene_design_format_unit_uniq',
            ),
        ),
        migrations.AddIndex(
            model_name='genedesignformatoption',
            index=models.Index(
                fields=['format_type', 'is_active', 'display_order'],
                name='gene_design_format_opt_idx',
            ),
        ),
        migrations.RunPython(
            seed_gene_design_format_types,
            remove_seeded_gene_design_format_types,
        ),
    ]
