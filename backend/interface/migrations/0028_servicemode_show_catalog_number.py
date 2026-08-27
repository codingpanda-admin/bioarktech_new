from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0027_servicemode_technique'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='show_catalog_number',
            field=models.BooleanField(default=True),
        ),
    ]
