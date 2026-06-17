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