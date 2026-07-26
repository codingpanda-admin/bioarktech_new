from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0019_servicemode_hidden'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='manuals',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
