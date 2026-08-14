from .models import Blog, BlogAttachment, BlogCategory, ResourceDocument
from rest_framework import serializers


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'display_order', 'is_active']


class BlogAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.FileField(source='file', read_only=True)

    class Meta:
        model = BlogAttachment
        fields = ['id', 'original_name', 'url', 'display_order', 'uploaded_at']


class BlogSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    attachments = BlogAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Blog
        fields = [
            'id', 'title', 'category', 'category_id', 'category_slug',
            'description', 'author', 'image', 'content', 'date_posted',
            'date_modified', 'is_featured', 'attachments',
        ]

class PreviewBlogSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Blog
        fields = [
            'id', 'title', 'category', 'category_id', 'category_slug',
            'description', 'author', 'image', 'date_posted', 'is_featured',
        ]

class ResourceDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceDocument
        fields = '__all__'
