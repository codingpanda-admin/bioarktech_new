from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0034_product_model_public_product_state'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('image_id', models.BigAutoField(primary_key=True, serialize=False)),
                ('image_url', models.TextField()),
                (
                    'product',
                    models.ForeignKey(
                        db_column='product_id',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='product_images',
                        to='products.product',
                    ),
                ),
            ],
            options={
                'db_table': 'product_image',
            },
        ),
    ]
