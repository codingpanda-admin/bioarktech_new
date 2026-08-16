from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0028_servicemode_show_catalog_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='investorcompanyoverview',
            name='roadmap_section_title',
            field=models.CharField(
                default='Development Roadmap & Milestones',
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name='investorcompanyoverview',
            name='strategy_section_title',
            field=models.CharField(
                default='Our Three-Tiered Strategy',
                max_length=255,
            ),
        ),
    ]
