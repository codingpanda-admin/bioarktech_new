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
    category = serializers.CharField(source='subgroup.name', read_only=True)
    level_1_group_id = serializers.IntegerField(source='subgroup.group_id', read_only=True)
    level_1_group = serializers.CharField(source='subgroup.group.name', read_only=True)
    level_1_group_order = serializers.IntegerField(source='subgroup.group.display_order', read_only=True)
    level_2_group_id = serializers.IntegerField(source='subgroup_id', read_only=True)
    level_2_group = serializers.CharField(source='subgroup.name', read_only=True)
    level_2_group_order = serializers.IntegerField(source='subgroup.display_order', read_only=True)

    class Meta:
        model = ResourceDocument
        fields = [
            'id', 'name', 'category', 'level_1_group_id', 'level_1_group',
            'level_1_group_order', 'level_2_group_id', 'level_2_group',
            'level_2_group_order', 'description', 'download_url', 'file',
            'date_created',
        ]
