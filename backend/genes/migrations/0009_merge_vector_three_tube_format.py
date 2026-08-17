from django.db import migrations


REMOVED_UNIT = '5ug each/3 tubes'
RETAINED_UNIT = '5ug each/3 tubes plus control'


def merge_vector_unit(apps, schema_editor):
    GeneDesignFormatOption = apps.get_model('genes', 'GeneDesignFormatOption')
    GeneDesignFormatType = apps.get_model('genes', 'GeneDesignFormatType')
    GeneDesignPrice = apps.get_model('genes', 'GeneDesignPrice')

    vector = GeneDesignFormatType.objects.filter(code_id='k').first()
    if not vector:
        return

    GeneDesignPrice.objects.filter(
        format_type=vector,
        unit_amount=REMOVED_UNIT,
    ).update(unit_amount=RETAINED_UNIT)
    GeneDesignFormatOption.objects.filter(
        format_type=vector,
        unit_amount=REMOVED_UNIT,
    ).delete()
    GeneDesignFormatOption.objects.filter(
        format_type=vector,
        unit_amount=RETAINED_UNIT,
    ).update(display_order=2, is_active=True)


def restore_vector_unit(apps, schema_editor):
    GeneDesignFormatOption = apps.get_model('genes', 'GeneDesignFormatOption')
    GeneDesignFormatType = apps.get_model('genes', 'GeneDesignFormatType')
    GeneDesignPrice = apps.get_model('genes', 'GeneDesignPrice')

    vector = GeneDesignFormatType.objects.filter(code_id='k').first()
    if not vector:
        return

    GeneDesignFormatOption.objects.update_or_create(
        format_type=vector,
        unit_amount=REMOVED_UNIT,
        defaults={'display_order': 2, 'is_active': True},
    )
    GeneDesignFormatOption.objects.filter(
        format_type=vector,
        unit_amount=RETAINED_UNIT,
    ).update(display_order=3)
    GeneDesignPrice.objects.filter(
        function_type_code='Others',
        target_gene_code='######',
        format_type=vector,
        unit_amount=RETAINED_UNIT,
    ).update(unit_amount=REMOVED_UNIT)


class Migration(migrations.Migration):
    dependencies = [
        ('genes', '0008_genedesignprice'),
    ]

    operations = [
        migrations.RunPython(merge_vector_unit, restore_vector_unit),
    ]
