from django.db import migrations, models


CATEGORIES = [
    {
        'code': 'crispr-cas9',
        'name': 'CRISPR-Cas9',
        'description': (
            'CRISPR is a powerful gene-editing technology that can precisely '
            'modify DNA sequences within living organisms.'
        ),
        'display_order': 1,
    },
    {
        'code': 'rnai',
        'name': 'RNAi',
        'description': (
            'RNA interference (RNAi) regulates gene expression by silencing '
            'specific mRNA molecules, thereby preventing the production of '
            'certain proteins.'
        ),
        'display_order': 2,
    },
    {
        'code': 'mammalian-cloning',
        'name': 'Mammalian Cloning',
        'description': (
            'The custom gene is regulated and expressed under a mammalian-type '
            'promoter and transcriptional components.'
        ),
        'display_order': 3,
    },
    {
        'code': 'prokaryotic-cloning',
        'name': 'Prokaryotic Cloning',
        'description': (
            'The custom gene is regulated and expressed under a '
            'prokaryotic-type promoter and transcriptional components.'
        ),
        'display_order': 4,
    },
]


def seed_gene_design_categories(apps, schema_editor):
    GeneDesignCategory = apps.get_model('genes', 'GeneDesignCategory')

    for category in CATEGORIES:
        GeneDesignCategory.objects.update_or_create(
            code=category['code'],
            defaults={
                'name': category['name'],
                'description': category['description'],
                'display_order': category['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_gene_design_categories(apps, schema_editor):
    GeneDesignCategory = apps.get_model('genes', 'GeneDesignCategory')
    GeneDesignCategory.objects.filter(
        code__in=[category['code'] for category in CATEGORIES]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignCategory',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'gene_design_category',
                'ordering': ['display_order', 'id'],
                'verbose_name_plural': 'gene design categories',
            },
        ),
        migrations.RunPython(
            seed_gene_design_categories,
            remove_seeded_gene_design_categories,
        ),
    ]
