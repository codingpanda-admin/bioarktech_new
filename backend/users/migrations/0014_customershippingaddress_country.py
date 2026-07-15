from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_customershippingaddress'),
    ]

    operations = [
        migrations.AddField(
            model_name='customershippingaddress',
            name='country',
            field=models.CharField(default='US', max_length=2),
        ),
    ]
