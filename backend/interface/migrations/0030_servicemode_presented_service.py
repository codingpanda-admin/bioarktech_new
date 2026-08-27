from django.db import migrations, models


def preserve_current_featured_panel(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    ServiceMode.objects.filter(is_featured=True).update(presented_service=True)


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0029_investor_section_titles'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='presented_service',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            preserve_current_featured_panel,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
