import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0048_correct_reagent_classification'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='videos',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(),
                blank=True,
                default=list,
                size=None,
            ),
        ),
    ]
