from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0032_bacterialmarker_description_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcategory',
            name='external_id',
            field=models.CharField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='productcategory',
            name='product_type',
            field=models.CharField(blank=True, null=True),
        ),
    ]
