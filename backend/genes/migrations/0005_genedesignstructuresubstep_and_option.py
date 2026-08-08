from django.db import migrations, models
import django.db.models.deletion


SUBSTEPS = [
    {'code': 'S1', 'name': 'Promoter', 'display_order': 1},
    {'code': 'S2', 'name': 'Property', 'display_order': 2},
    {'code': 'S3', 'name': 'Tag', 'display_order': 3},
    {'code': 'S4', 'name': 'Fluorescence Marker', 'display_order': 4},
    {'code': 'S5', 'name': 'Selection Marker', 'display_order': 5},
    {'code': 'S6', 'name': 'Bacterial Marker', 'display_order': 6},
]


OPTIONS = [
    {'substep_code': 'S1', 'value': 'None', 'value_code': '0', 'display_order': 1},
    {'substep_code': 'S1', 'value': 'PCMV', 'value_code': 'C', 'display_order': 2},
    {'substep_code': 'S1', 'value': 'EF1a', 'value_code': 'E', 'display_order': 3},
    {'substep_code': 'S1', 'value': 'EF1a Core', 'value_code': 'F', 'display_order': 4},
    {'substep_code': 'S1', 'value': 'U6', 'value_code': 'U', 'display_order': 5},
    {'substep_code': 'S1', 'value': 'inducible', 'value_code': 'D', 'display_order': 6},
    {'substep_code': 'S2', 'value': 'X', 'value_code': 'X', 'display_order': 1},
    {'substep_code': 'S3', 'value': 'None', 'value_code': '0', 'display_order': 1},
    {'substep_code': 'S3', 'value': 'His', 'value_code': 'H', 'display_order': 2},
    {'substep_code': 'S3', 'value': 'MycDDK', 'value_code': 'D', 'display_order': 3},
    {'substep_code': 'S3', 'value': 'customized', 'value_code': 'I', 'display_order': 4},
    {'substep_code': 'S4', 'value': 'None', 'value_code': '0', 'display_order': 1},
    {'substep_code': 'S4', 'value': 'GFP', 'value_code': 'G', 'display_order': 2},
    {'substep_code': 'S4', 'value': 'RFP', 'value_code': 'R', 'display_order': 3},
    {'substep_code': 'S4', 'value': 'BFP', 'value_code': 'B', 'display_order': 4},
    {'substep_code': 'S4', 'value': 'Luciferase', 'value_code': 'L', 'display_order': 5},
    {'substep_code': 'S5', 'value': 'None', 'value_code': '0', 'display_order': 1},
    {'substep_code': 'S5', 'value': 'Puro', 'value_code': 'P', 'display_order': 2},
    {'substep_code': 'S5', 'value': 'BSD', 'value_code': 'B', 'display_order': 3},
    {'substep_code': 'S5', 'value': 'Neo', 'value_code': 'N', 'display_order': 4},
    {'substep_code': 'S6', 'value': 'CAM', 'value_code': 'C', 'display_order': 1},
    {'substep_code': 'S6', 'value': 'AMP', 'value_code': 'A', 'display_order': 2},
]


def seed_gene_design_structure(apps, schema_editor):
    GeneDesignStructureSubstep = apps.get_model(
        'genes', 'GeneDesignStructureSubstep'
    )
    GeneDesignStructureOption = apps.get_model(
        'genes', 'GeneDesignStructureOption'
    )

    substeps = {}
    for substep in SUBSTEPS:
        record, _ = GeneDesignStructureSubstep.objects.update_or_create(
            code=substep['code'],
            defaults={
                'name': substep['name'],
                'display_order': substep['display_order'],
                'is_active': True,
            },
        )
        substeps[substep['code']] = record

    for option in OPTIONS:
        GeneDesignStructureOption.objects.update_or_create(
            substep=substeps[option['substep_code']],
            value_code=option['value_code'],
            defaults={
                'value': option['value'],
                'display_order': option['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_gene_design_structure(apps, schema_editor):
    GeneDesignStructureSubstep = apps.get_model(
        'genes', 'GeneDesignStructureSubstep'
    )
    GeneDesignStructureOption = apps.get_model(
        'genes', 'GeneDesignStructureOption'
    )
    seeded_substeps = GeneDesignStructureSubstep.objects.filter(
        code__in=[substep['code'] for substep in SUBSTEPS]
    )
    GeneDesignStructureOption.objects.filter(
        substep__in=seeded_substeps
    ).delete()
    seeded_substeps.delete()


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0004_genedesigndeliverytype'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneDesignStructureSubstep',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=10, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'gene_design_structure_substep',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='GeneDesignStructureOption',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('value', models.CharField(max_length=100)),
                ('value_code', models.CharField(max_length=10)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'substep',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='options',
                        to='genes.genedesignstructuresubstep',
                    ),
                ),
            ],
            options={
                'db_table': 'gene_design_structure_option',
                'ordering': ['substep_id', 'display_order', 'id'],
            },
        ),
        migrations.AddConstraint(
            model_name='genedesignstructureoption',
            constraint=models.UniqueConstraint(
                fields=('substep', 'value_code'),
                name='gene_design_struct_code_uniq',
            ),
        ),
        migrations.AddConstraint(
            model_name='genedesignstructureoption',
            constraint=models.UniqueConstraint(
                fields=('substep', 'value'),
                name='gene_design_struct_value_uniq',
            ),
        ),
        migrations.AddIndex(
            model_name='genedesignstructureoption',
            index=models.Index(
                fields=['substep', 'is_active', 'display_order'],
                name='gene_design_struct_opt_idx',
            ),
        ),
        migrations.RunPython(
            seed_gene_design_structure,
            remove_seeded_gene_design_structure,
        ),
    ]
