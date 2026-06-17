from django.db import models
from django.utils import timezone
from tinymce.models import HTMLField


# Create your models here.
class Blog(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=150)
    author = models.CharField(max_length=30)
    image = models.ImageField(upload_to='blog_images', blank=True, null=True)
    content = HTMLField()
    date_posted = models.DateTimeField(default=timezone.now)
    date_modified = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'blog'