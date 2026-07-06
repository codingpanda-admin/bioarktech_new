from django.db import migrations

def set_show_on_screen(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    ServiceMode.objects.filter(is_featured=True).update(show_on_screen=True)

class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0013_servicemode_category'),
    ]

    operations = [
        migrations.RunPython(set_show_on_screen),
    ]
