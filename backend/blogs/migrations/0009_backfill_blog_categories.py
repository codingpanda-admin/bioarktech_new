from django.db import migrations


def backfill_blog_categories(apps, schema_editor):
    Blog = apps.get_model('blogs', 'Blog')

    for blog in Blog.objects.all().only('id', 'title', 'description'):
        text = f'{blog.title or ""} {blog.description or ""}'.lower()
        if 'bioark' in text or 'company' in text or 'growth' in text:
            category = 'BioArk News'
        elif 'business' in text or 'market' in text or 'economics' in text:
            category = 'Business News'
        else:
            category = 'Biotech Outlook'

        Blog.objects.filter(id=blog.id).update(category=category)


class Migration(migrations.Migration):

    dependencies = [
        ('blogs', '0008_blog_category'),
    ]

    operations = [
        migrations.RunPython(backfill_blog_categories, migrations.RunPython.noop),
    ]
