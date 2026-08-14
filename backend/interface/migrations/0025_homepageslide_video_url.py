from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0024_investor_page_content'),
    ]

    operations = [
        migrations.AddField(
            model_name='homepageslide',
            name='video_url',
            field=models.TextField(blank=True, null=True),
        ),
    ]
