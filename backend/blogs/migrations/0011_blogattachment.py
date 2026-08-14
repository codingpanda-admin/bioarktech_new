from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('blogs', '0010_blog_category_entity'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlogAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='blog_attachments/')),
                ('original_name', models.CharField(max_length=255)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('blog', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='blogs.blog')),
            ],
            options={
                'db_table': 'blog_attachment',
                'ordering': ('display_order', 'id'),
            },
        ),
    ]
