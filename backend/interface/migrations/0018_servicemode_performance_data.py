from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0017_servicemode_catalog_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='performance_data',
            field=models.TextField(blank=True, default=''),
        ),
    ]
