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
    category = models.CharField(max_length=100, blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    show_on_screen = models.BooleanField(default=False)

    class Meta:
        db_table = 'service_mode'

class HomepageSlide(models.Model):
    id = models.AutoField(primary_key=True)
    eyebrow = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    primary_button_text = models.CharField(max_length=100, blank=True, null=True)
    primary_button_link = models.CharField(max_length=255, blank=True, null=True)
    secondary_button_text = models.CharField(max_length=100, blank=True, null=True)
    secondary_button_link = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'homepage_slide'
        ordering = ['display_order', 'id']

