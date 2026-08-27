from django.db import migrations, models


DELIVERY_TYPES = [
    {
        'symbol_id': 'S',
        'abbreviation': 'Std',
        'name': 'Standard',
        'class_name': 'Non-Viral Standard',
        'description': (
            'It is a non-viral structure. If multiple components are included, '
            'they are separated into different vectors. For example, Cas9 or its '
            'variants are placed in separate vectors from the gRNA, and the '
            'expression of Tet protein is separated from Tet-induced responsive '
            'elements.'
        ),
        'display_order': 1,
    },
    {
        'symbol_id': 'T',
        'abbreviation': 'AIO',
        'name': 'All-in-One',
        'class_name': 'Non-Viral All-In-One',
        'description': (
            'It is a non-viral construct that integrates multiple components '
            'into a single vector. In CRISPR applications, the Cas9 and gRNA '
            'vectors are combined into a single plasmid. Similarly, in an '
            'inducible vector, the expression of the Tet protein and its '
            'inducible cassette are incorporated into one plasmid.'
        ),
        'display_order': 2,
    },
    {
        'symbol_id': 'L',
        'abbreviation': 'Lenti',
        'name': 'Lentivirus',
        'class_name': 'Viral Standard',
        'description': (
            'It is a viral structure. If multiple components are included, they '
            'are separated into different vectors. For example, Cas9 or its '
            'variants are placed in separate vectors from the gRNA, and the '
            'expression of Tet protein is separated from Tet-induced responsive '
            'elements.'
        ),
        'display_order': 3,
    },
    {
        'symbol_id': 'M',
        'abbreviation': 'Lenti-AIO',
        'name': 'Lenti All-in-One',
        'class_name': 'Viral All-In-One',
        'description': (
            'It is a viral construct that integrates multiple components into a '
            'single vector. In CRISPR applications, the Cas9 and gRNA vectors '
            'are combined into a single plasmid. Similarly, in an inducible '
            'vector, the expression of the Tet protein and its inducible cassette '
            'are incorporated into one plasmid.'
        ),
        'display_order': 4,
    },
]


def seed_gene_design_delivery_types(apps, schema_editor):
    GeneDesignDeliveryType = apps.get_model('genes', 'GeneDesignDeliveryType')

    for delivery_type in DELIVERY_TYPES:
        GeneDesignDeliveryType.objects.update_or_create(
            symbol_id=delivery_type['symbol_id'],
            defaults={
                'abbreviation': delivery_type['abbreviation'],
                'name': delivery_type['name'],
                'class_name': delivery_type['class_name'],
                'description': delivery_type['description'],
                'display_order': delivery_type['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_gene_design_delivery_types(apps, schema_editor):
    GeneDesignDeliveryType = apps.get_model('genes', 'GeneDesignDeliveryType')
    GeneDesignDeliveryType.objects.filter(
        symbol_id__in=[item['symbol_id'] for item in DELIVERY_TYPES]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0003_genedesignfunctiontype'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignDeliveryType',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('symbol_id', models.CharField(max_length=10, unique=True)),
                ('abbreviation', models.CharField(max_length=50)),
                ('name', models.CharField(max_length=100)),
                ('class_name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'gene_design_delivery_type',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='genedesigndeliverytype',
            index=models.Index(
                fields=['is_active', 'display_order'],
                name='gene_design_delivery_idx',
            ),
        ),
        migrations.RunPython(
            seed_gene_design_delivery_types,
            remove_seeded_gene_design_delivery_types,
        ),
    ]
