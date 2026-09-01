from django.db import models
from django.utils import timezone
from tinymce.models import HTMLField


# Create your models here.
class BlogCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'blog_category'
        ordering = ('display_order', 'name')


class Blog(models.Model):
    title = models.CharField(max_length=200)
    category = models.ForeignKey(BlogCategory, on_delete=models.PROTECT, related_name='blogs')
    description = models.CharField(max_length=500)
    author = models.CharField(max_length=30)
    image = models.ImageField(upload_to='blog_images', blank=True, null=True)
    content = HTMLField()
    date_posted = models.DateTimeField(default=timezone.now)
    date_modified = models.DateTimeField(auto_now=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        db_table = 'blog'


class BlogAttachment(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='blog_attachments/')
    original_name = models.CharField(max_length=255)
    display_order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blog_attachment'
        ordering = ('display_order', 'id')

    def __str__(self):
        return self.original_name


class ResourceDocumentGroup(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'resource_document_group'
        ordering = ('display_order', 'name')


class ResourceDocumentSubgroup(models.Model):
    group = models.ForeignKey(
        ResourceDocumentGroup,
        on_delete=models.PROTECT,
        related_name='subgroups',
    )
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.group.name} / {self.name}'

    class Meta:
        db_table = 'resource_document_subgroup'
        ordering = ('group__display_order', 'display_order', 'name')
        constraints = [
            models.UniqueConstraint(
                fields=('group', 'name'),
                name='resource_doc_subgroup_group_name_uniq',
            ),
        ]


class ResourceDocument(models.Model):
    name = models.CharField(max_length=200)
    subgroup = models.ForeignKey(
        ResourceDocumentSubgroup,
        on_delete=models.PROTECT,
        related_name='documents',
    )
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
