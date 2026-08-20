from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
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
    page = get_object_or_404(ServiceMode, url=url, hidden=False)
    serializer = ServiceModeSerializer(page)

    return JsonResponse(serializer.data)

@api_view(['GET'])
def get_homepage_slides(request):
    slides = HomepageSlide.objects.filter(is_active=True).order_by('display_order', 'id')
    serializer = HomepageSlideSerializer(slides, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def get_featured_services(request):
    services = ServiceMode.objects.filter(is_featured=True, hidden=False).order_by('title')
    serializer = ServiceModeSerializer(services, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def get_homepage_services(request):
    services = ServiceMode.objects.filter(show_on_screen=True, hidden=False).order_by('title')
    serializer = ServiceModeSerializer(services, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def get_google_auth_config(request):
    config = SmtpConfig.objects.first()
    client_id = config.google_client_id if config and config.google_client_id else '1047155694294-1a3b4c5d6e7f8g9h0i.apps.googleusercontent.com'
    return JsonResponse({'client_id': client_id})

