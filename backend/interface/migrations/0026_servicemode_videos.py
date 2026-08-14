from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0025_homepageslide_video_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='videos',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
