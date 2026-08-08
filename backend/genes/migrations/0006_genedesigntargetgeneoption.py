from django.db import migrations, models


TARGET_GENE_OPTIONS = [
    {
        'code_id': '000000',
        'abbreviation': 'Ctrl',
        'name': 'Control (or Scramble)',
        'description': (
            'High-quality control vectors designed to provide balanced '
            'experimental controls and ensure reliable comparison of target '
            'gene expression in functional studies.'
        ),
        'display_order': 1,
    },
    {
        'code_id': 'xxxxxx',
        'abbreviation': 'None',
        'name': 'Non-Insert (Template)',
        'description': (
            "BioArk's Functional Vector Template Production service provides "
            'pre-engineered vector platforms containing established functional '
            'modules that are ready for insertion of your gene of interest. By '
            'integrating your target gene into a validated vector template, '
            'researchers can rapidly generate customized expression constructs '
            'while preserving the desired biological function.\n\n'
            'Our vector templates are available with a wide range of built-in '
            'functional elements, including fluorescent reporters, epitope '
            'tags, secretion signals, inducible expression systems, CRISPR/Cas '
            'components, shRNA expression cassettes, selection markers, and '
            'viral packaging elements. This approach significantly reduces '
            'development time while ensuring reliable performance and '
            'experimental consistency.'
        ),
        'display_order': 2,
    },
]


def seed_gene_design_target_gene_options(apps, schema_editor):
    GeneDesignTargetGeneOption = apps.get_model(
        'genes', 'GeneDesignTargetGeneOption'
    )

    for option in TARGET_GENE_OPTIONS:
        GeneDesignTargetGeneOption.objects.update_or_create(
            code_id=option['code_id'],
            defaults={
                'abbreviation': option['abbreviation'],
                'name': option['name'],
                'description': option['description'],
                'display_order': option['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_gene_design_target_gene_options(apps, schema_editor):
    GeneDesignTargetGeneOption = apps.get_model(
        'genes', 'GeneDesignTargetGeneOption'
    )
    GeneDesignTargetGeneOption.objects.filter(
        code_id__in=[option['code_id'] for option in TARGET_GENE_OPTIONS]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0005_genedesignstructuresubstep_and_option'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignTargetGeneOption',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('code_id', models.CharField(max_length=20, unique=True)),
                ('abbreviation', models.CharField(max_length=50)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'gene_design_target_gene_option',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='genedesigntargetgeneoption',
            index=models.Index(
                fields=['is_active', 'display_order'],
                name='gene_design_target_gene_idx',
            ),
        ),
        migrations.RunPython(
            seed_gene_design_target_gene_options,
            remove_seeded_gene_design_target_gene_options,
        ),
    ]
