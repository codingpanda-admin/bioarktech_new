from django.db import models
from tinymce.models import HTMLField

# Create your models here.
class ProductMode(models.Model):
    url = models.CharField()
    title = models.CharField(max_length=60)
    content = HTMLField()
    image = models.ImageField(blank=True, null=True)

    class Meta:
        db_table = 'product_mode'

class ServiceMode(models.Model):
    url = models.CharField()
    title = models.CharField(max_length=60)
    content = HTMLField()
    image = models.ImageField(blank=True, null=True)

    class Meta:
        db_table = 'service_mode'
