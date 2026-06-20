from django.urls import path

from . import views


urlpatterns = [
    path('', views.create_quote, name='create-quote'),
    path('list/', views.list_quotes, name='list-quotes'),
    path('<int:quote_id>/', views.get_quote, name='get-quote'),
]

