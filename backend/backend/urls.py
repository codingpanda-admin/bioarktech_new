"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import include, path, re_path
from .views import home_view
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as serve_media

from django.views.decorators.clickjacking import xframe_options_exempt

urlpatterns = [
    path('', home_view),
    path('api/', include('api.urls')),
    path('tinymce/', include('tinymce.urls')),
]

# Serve media files in both development and production, exempting them from X-Frame-Options to allow frontend previews
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', xframe_options_exempt(serve_media), {'document_root': settings.MEDIA_ROOT}),
]
