from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blogs', '0007_resourcedocument'),
    ]

    operations = [
        migrations.AddField(
            model_name='blog',
            name='category',
            field=models.CharField(
                choices=[
                    ('BioArk News', 'BioArk News'),
                    ('Biotech Outlook', 'Biotech Outlook'),
                    ('Business News', 'Business News'),
                ],
                default='Biotech Outlook',
                max_length=50,
            ),
        ),
    ]
