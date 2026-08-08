from django.urls import path

from . import views


urlpatterns = [
    path('design-metadata/', views.get_design_metadata, name='design-metadata'),
    path('gene-library/', views.search_gene_library, name='gene-library-search'),
]
