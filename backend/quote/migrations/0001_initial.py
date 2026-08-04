# Generated for the existing public.quote table.

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Quote',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('external_id', models.CharField(blank=True, max_length=64, null=True)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('email', models.CharField(max_length=255)),
                ('phone', models.CharField(blank=True, max_length=50, null=True)),
                ('company', models.CharField(blank=True, max_length=255, null=True)),
                ('department', models.CharField(blank=True, max_length=255, null=True)),
                ('service_type', models.CharField(blank=True, max_length=100, null=True)),
                ('timeline', models.CharField(blank=True, max_length=255, null=True)),
                ('budget', models.CharField(blank=True, max_length=255, null=True)),
                ('project_description', models.TextField(blank=True, null=True)),
                ('additional_info', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('read', models.BooleanField(default=False)),
            ],
            options={
                'db_table': 'quote',
                'managed': False,
            },
        ),
    ]
