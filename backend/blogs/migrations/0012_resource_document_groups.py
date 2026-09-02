from django.db import migrations, models
import django.db.models.deletion


DEFAULT_LEVEL_1 = 'Product Documents'
DEFAULT_LEVEL_2 = 'Product Manual'


def assign_default_groups(apps, schema_editor):
    ResourceDocument = apps.get_model('blogs', 'ResourceDocument')
    ResourceDocumentGroup = apps.get_model('blogs', 'ResourceDocumentGroup')
    ResourceDocumentSubgroup = apps.get_model('blogs', 'ResourceDocumentSubgroup')

    group, _ = ResourceDocumentGroup.objects.get_or_create(
        name=DEFAULT_LEVEL_1,
        defaults={'display_order': 0},
    )
    subgroup, _ = ResourceDocumentSubgroup.objects.get_or_create(
        group=group,
        name=DEFAULT_LEVEL_2,
        defaults={'display_order': 0},
    )
    ResourceDocument.objects.all().update(subgroup=subgroup)


class Migration(migrations.Migration):

    dependencies = [
        ('blogs', '0011_blogattachment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resourcedocument',
            name='category',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.CreateModel(
            name='ResourceDocumentGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'resource_document_group',
                'ordering': ('display_order', 'name'),
            },
        ),
        migrations.CreateModel(
            name='ResourceDocumentSubgroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='subgroups', to='blogs.resourcedocumentgroup')),
            ],
            options={
                'db_table': 'resource_document_subgroup',
                'ordering': ('group__display_order', 'display_order', 'name'),
            },
        ),
        migrations.AddConstraint(
            model_name='resourcedocumentsubgroup',
            constraint=models.UniqueConstraint(fields=('group', 'name'), name='resource_doc_subgroup_group_name_uniq'),
        ),
        migrations.AddField(
            model_name='resourcedocument',
            name='subgroup',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='documents', to='blogs.resourcedocumentsubgroup'),
        ),
        migrations.RunPython(assign_default_groups, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='resourcedocument',
            name='subgroup',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='documents', to='blogs.resourcedocumentsubgroup'),
        ),
        migrations.RemoveField(
            model_name='resourcedocument',
            name='category',
        ),
    ]
