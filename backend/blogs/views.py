from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.shortcuts import render
from .models import Blog, BlogCategory
from .serializers import *

# Create your views here.
@api_view(["GET"])
def get_blog(request, blog_id):
    blog = Blog.objects.select_related('category').get(id=blog_id)
    serializer = BlogSerializer(blog)
    return JsonResponse(serializer.data)

@api_view(["GET"])
def get_latest_blogs(request):
    posts = Blog.objects.select_related('category').order_by('-date_posted')[:3]
    serializer = PreviewBlogSerializer(posts, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(["GET"])
def get_all_blogs(request):
    posts = Blog.objects.select_related('category').order_by('-date_posted')
    serializer = PreviewBlogSerializer(posts, many=True)
    return JsonResponse(serializer.data, safe=False)


@api_view(["GET"])
def get_blog_categories(request):
    categories = BlogCategory.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer = BlogCategorySerializer(categories, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(["GET"])
def get_all_resources(request):
    resources = ResourceDocument.objects.select_related('subgroup__group').order_by('-date_created')
    serializer = ResourceDocumentSerializer(resources, many=True)
    return JsonResponse(serializer.data, safe=False)
