from django.db import models
from django.utils import timezone
from tinymce.models import HTMLField


# Create your models here.
class Blog(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=500)
    author = models.CharField(max_length=30)
    image = models.ImageField(upload_to='blog_images', blank=True, null=True)
    content = HTMLField()
    date_posted = models.DateTimeField(default=timezone.now)
    date_modified = models.DateTimeField(auto_now=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        db_table = 'blog'


class ResourceDocument(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=500, blank=True, null=True)
    download_url = models.CharField(max_length=500, blank=True, null=True)
    file = models.FileField(upload_to='resource_documents/', blank=True, null=True)
    date_created = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.file and not self.download_url:
            self.download_url = self.file.url
            super().save(*args, **kwargs)

    class Meta:
        db_table = 'resource_document'