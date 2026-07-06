from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view

from .models import *
from .serializers import *

# Create your views here.
@api_view(['GET'])
def get_product_page(request, url):
    page = ProductMode.objects.get(url=url)
    serializer = ProductModeSerializer(page)

    return JsonResponse(serializer.data)

@api_view(['GET'])
def get_service_page(request, url):
    page = ServiceMode.objects.get(url=url)
    serializer = ServiceModeSerializer(page)

    return JsonResponse(serializer.data)

@api_view(['GET'])
def get_homepage_slides(request):
    slides = HomepageSlide.objects.filter(is_active=True).order_by('display_order', 'id')
    serializer = HomepageSlideSerializer(slides, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def get_featured_services(request):
    services = ServiceMode.objects.filter(show_on_screen=True)
    serializer = ServiceModeSerializer(services, many=True)
    return JsonResponse(serializer.data, safe=False)