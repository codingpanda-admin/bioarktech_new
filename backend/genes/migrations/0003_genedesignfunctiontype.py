from django.db import migrations, models
import django.db.models.deletion


FUNCTION_TYPES = [
    {
        'category_code': 'crispr-cas9',
        'symbol_id': 'CA',
        'abbreviation': 'CRISPRa',
        'name': 'CRISPRa',
        'description': (
            'CRISPR activation aims to upregulate or activate the expression of '
            'specific genes using the CRISPR-dCas9 (D10A/H840A) platform '
            'integrated with activating proteins. In the customer design mode, '
            'the optimized VPH activating protein (VP64-p65-HSF1) is used as an '
            'activation partner, which has been proven to effectively stimulate '
            'downstream promoters.'
        ),
        'display_order': 1,
    },
    {
        'category_code': 'crispr-cas9',
        'symbol_id': 'CI',
        'abbreviation': 'CRISPRi',
        'name': 'CRISPRi',
        'description': (
            'CRISPR inhibition aims to suppress the expression of specific genes '
            'using the CRISPR-dCas9 (D10A/H840A) platform paired with inhibitory '
            'proteins. In the customer design mode, the optimized KRAB-MeCP2 '
            'inhibitory protein is used as an inhibition partner, which has been '
            'proven to effectively suppress downstream promoters.'
        ),
        'display_order': 2,
    },
    {
        'category_code': 'crispr-cas9',
        'symbol_id': 'CO',
        'abbreviation': 'CRISPR KN',
        'name': 'CRISPR KnockOut',
        'description': (
            'CRISPR-KO provides methodologies for knocking out target genes using '
            'validated CRISPR techniques. In the customer design mode, wild-type '
            'SpCas9 is used to precisely cleave double-stranded DNA.'
        ),
        'display_order': 3,
    },
    {
        'category_code': 'crispr-cas9',
        'symbol_id': 'CD',
        'abbreviation': 'AAVS1 Dnr',
        'name': 'CRISPR AAVS1 Donor',
        'description': (
            'CRISPR Donor enables the precise insertion of custom DNA fragments '
            'into the human-specific safe harbor AAVS1 site by integrating with '
            'the CRISPR knock-out kit targeting AAVS1. It is specifically designed '
            'for CRISPR AAVS1 knock-in product kits.'
        ),
        'display_order': 4,
    },
    {
        'category_code': 'crispr-cas9',
        'symbol_id': 'CR',
        'abbreviation': 'CRISPR KD',
        'name': 'CRISPR RNA Knockdown',
        'description': (
            'CRISPR-based RNA interference focuses on targeting and regulating '
            'RNA expression using the CRISPR-Cas13 system.'
        ),
        'display_order': 5,
    },
    {
        'category_code': 'rnai',
        'symbol_id': 'SH',
        'abbreviation': 'RNAi',
        'name': 'RNAi',
        'description': (
            'RNA interference (RNAi) is a biological process in which RNA '
            'molecules suppress gene expression or translation by silencing '
            'specific mRNA targets.'
        ),
        'display_order': 1,
    },
    {
        'category_code': 'mammalian-cloning',
        'symbol_id': 'EM',
        'abbreviation': 'Over-Exp',
        'name': 'Overexpression',
        'description': (
            'The custom genes will be cloned into mammalian expression vectors, '
            'providing a variety of protein tags, fluorescence markers, and '
            'selection markers.'
        ),
        'display_order': 1,
    },
    {
        'category_code': 'mammalian-cloning',
        'symbol_id': 'IM',
        'abbreviation': 'Inducible',
        'name': 'Inducible Expression',
        'description': (
            'The custom genes are controlled by a doxycycline-inducible promoter. '
            'The expression of the Tet-on protein is available as either a '
            'standard kit or incorporated into a single all-in-one vector.'
        ),
        'display_order': 2,
    },
    {
        'category_code': 'prokaryotic-cloning',
        'symbol_id': 'EP',
        'abbreviation': 'Protein',
        'name': 'Protein Expression',
        'description': (
            'The prokaryotic vector drives the expression of custom genes, used '
            'for protein expression and purification.'
        ),
        'display_order': 1,
    },
]


def seed_gene_design_function_types(apps, schema_editor):
    GeneDesignCategory = apps.get_model('genes', 'GeneDesignCategory')
    GeneDesignFunctionType = apps.get_model('genes', 'GeneDesignFunctionType')
    categories = {
        category.code: category
        for category in GeneDesignCategory.objects.filter(
            code__in={item['category_code'] for item in FUNCTION_TYPES}
        )
    }

    for function_type in FUNCTION_TYPES:
        category = categories[function_type['category_code']]
        GeneDesignFunctionType.objects.update_or_create(
            symbol_id=function_type['symbol_id'],
            defaults={
                'category': category,
                'abbreviation': function_type['abbreviation'],
                'name': function_type['name'],
                'description': function_type['description'],
                'display_order': function_type['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_gene_design_function_types(apps, schema_editor):
    GeneDesignFunctionType = apps.get_model('genes', 'GeneDesignFunctionType')
    GeneDesignFunctionType.objects.filter(
        symbol_id__in=[item['symbol_id'] for item in FUNCTION_TYPES]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0002_genedesigncategory'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignFunctionType',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('symbol_id', models.CharField(max_length=10, unique=True)),
                ('abbreviation', models.CharField(max_length=50)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'category',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='function_types',
                        to='genes.genedesigncategory',
                    ),
                ),
            ],
            options={
                'db_table': 'gene_design_function_type',
                'ordering': ['category_id', 'display_order', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='genedesignfunctiontype',
            index=models.Index(
                fields=['category', 'is_active', 'display_order'],
                name='gene_design_fn_cat_idx',
            ),
        ),
        migrations.RunPython(
            seed_gene_design_function_types,
            remove_seeded_gene_design_function_types,
        ),
    ]
