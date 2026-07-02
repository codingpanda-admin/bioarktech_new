from .models import Blog, ResourceDocument
from rest_framework import serializers

class BlogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = '__all__'

class PreviewBlogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = ['id', 'title', 'description', 'author', 'image', 'date_posted', 'is_featured']

class ResourceDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceDocument
        fields = '__all__'