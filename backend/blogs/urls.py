from django.urls import path
from . import views

urlpatterns = [
    path('get-blog/<int:blog_id>/', views.get_blog),
    path('get-latest-blogs/', views.get_latest_blogs),
]
