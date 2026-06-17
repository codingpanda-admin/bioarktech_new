from django.urls import path
from . import views

urlpatterns = [
    path('load-product-categories/', views.load_product_categories),
    path('get-function-types-by-category/', views.get_function_types_by_category),
    path('get-structure-types-by-function-type/', views.get_structure_types_by_function_type),
    path('get-code-p-parameters/', views.get_code_p_parameters),
    path('get-gene-table-by-symbol/', views.get_gene_table_by_symbol),
    path('get-delivery-format-table/', views.get_delivery_format_table),
    path('get-product-summary/<str:product_sku>/', views.get_product_summary),
    path('get-product-sku/', views.get_product_sku),
    path('load-featured-product-page/<str:catalog_number>', views.load_featured_product_page),
    path('get-latest-featured-products/', views.get_latest_featured_products),
    path('update-shelf-price/', views.update_shelf_price),
]