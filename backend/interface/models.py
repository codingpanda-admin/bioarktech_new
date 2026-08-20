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
    catalog_number = models.CharField(max_length=100, blank=True, null=True)
    content = HTMLField()
    price = HTMLField(blank=True, default='')
    performance_data = models.TextField(blank=True, default='')
    manuals = models.JSONField(default=list, blank=True)
    image = models.ImageField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    service_group = models.CharField(max_length=100, blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    show_on_screen = models.BooleanField(default=False)
    hidden = models.BooleanField(default=False)

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


class SmtpConfig(models.Model):
    # Google OAuth 2.0 for Email Sending
    use_google_oauth = models.BooleanField(default=True)
    google_client_id = models.CharField(max_length=255, blank=True, default='')
    google_client_secret = models.CharField(max_length=255, blank=True, default='')
    google_refresh_token = models.TextField(blank=True, default='')
    sender_email = models.EmailField(default='wulipeng@gmail.com')
    admin_to_emails = models.CharField(max_length=500, default='Lipengwu@bioarktech.com')

    # Legacy SMTP (fallback)
    host = models.CharField(max_length=255, default='smtp.gmail.com')
    port = models.IntegerField(default=465)
    secure = models.BooleanField(default=True)
    user = models.EmailField(default='wulipeng@gmail.com')
    password = models.CharField(max_length=255, blank=True, default='')
    from_email = models.EmailField(default='wulipeng@gmail.com')

    # Full Form Email Template
    full_subject = models.CharField(
        max_length=255,
        default='New Quote (Full) from {{firstName}} {{lastName}} — {{serviceType}}'
    )
    full_body = models.TextField(
        default='<h2>New Quote (Full) Notification</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n{{#if phone}}<p><strong>Phone:</strong> {{phone}}</p>{{/if}}\n<p><strong>Company:</strong> {{company}}</p>\n{{#if department}}<p><strong>Department:</strong> {{department}}</p>{{/if}}\n<p><strong>Service:</strong> {{serviceType}}</p>\n<p><strong>Description:</strong> {{projectDescription}}</p>'
    )

    # Product Quote Email Template
    product_subject = models.CharField(
        max_length=255,
        default='New Product Quote from {{firstName}} {{lastName}}'
    )
    product_body = models.TextField(
        default='<h2>New Product Quote</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n<hr/>\n<p><strong>Product:</strong> {{projectDescription}}</p>\n{{#if catalogNumber}}<p><strong>Catalog #:</strong> {{catalogNumber}}</p>{{/if}}'
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'smtp_config'



