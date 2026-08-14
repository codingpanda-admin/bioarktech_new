from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


DEFAULT_CATEGORIES = (
    ('BioArk News', 1),
    ('Biotech Outlook', 2),
    ('Business News', 3),
)


def create_categories_and_link_blogs(apps, schema_editor):
    Blog = apps.get_model('blogs', 'Blog')
    BlogCategory = apps.get_model('blogs', 'BlogCategory')

    categories_by_name = {}
    for name, display_order in DEFAULT_CATEGORIES:
        category, _created = BlogCategory.objects.get_or_create(
            name=name,
            defaults={
                'slug': slugify(name),
                'display_order': display_order,
                'is_active': True,
            },
        )
        categories_by_name[name.casefold()] = category

    next_order = 100
    for blog in Blog.objects.all().order_by('id'):
        name = (blog.category_name or '').strip() or 'Biotech Outlook'
        category = categories_by_name.get(name.casefold())
        if category is None:
            base_slug = slugify(name) or 'blog-category'
            slug = base_slug
            suffix = 2
            while BlogCategory.objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{suffix}'
                suffix += 1
            category = BlogCategory.objects.create(
                name=name,
                slug=slug,
                display_order=next_order,
                is_active=True,
            )
            categories_by_name[name.casefold()] = category
            next_order += 1

        Blog.objects.filter(pk=blog.pk).update(category_id=category.pk)


def restore_category_names(apps, schema_editor):
    Blog = apps.get_model('blogs', 'Blog')
    for blog in Blog.objects.select_related('category').all():
        category_name = blog.category.name if blog.category_id else 'Biotech Outlook'
        Blog.objects.filter(pk=blog.pk).update(category_name=category_name)


class Migration(migrations.Migration):

    dependencies = [
        ('blogs', '0009_backfill_blog_categories'),
    ]

    operations = [
        migrations.RenameField(
            model_name='blog',
            old_name='category',
            new_name='category_name',
        ),
        migrations.CreateModel(
            name='BlogCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'blog_category',
                'ordering': ('display_order', 'name'),
            },
        ),
        migrations.AddField(
            model_name='blog',
            name='category',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='blogs',
                to='blogs.blogcategory',
            ),
        ),
        migrations.RunPython(create_categories_and_link_blogs, restore_category_names),
        migrations.RemoveField(
            model_name='blog',
            name='category_name',
        ),
        migrations.AlterField(
            model_name='blog',
            name='category',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='blogs',
                to='blogs.blogcategory',
            ),
        ),
    ]
