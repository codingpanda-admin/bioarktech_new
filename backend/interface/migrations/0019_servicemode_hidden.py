from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0018_servicemode_performance_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='hidden',
            field=models.BooleanField(default=False),
        ),
    ]
