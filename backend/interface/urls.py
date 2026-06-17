from django.urls import path
from . import views

urlpatterns = [
    path('get-product-page/<str:url>/', views.get_product_page),
    path('get-service-page/<str:url>/', views.get_service_page),
]
