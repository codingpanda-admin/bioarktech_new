from django.urls import path
from . import views

urlpatterns = [
    path('example-view/', views.example_view),
    path('view-order/<str:payment_token>', views.view_order),
    path('view-orders/', views.view_orders),
    path('view-user-info/', views.view_user_info),
    path('admin-users/', views.list_admin_users),
    path('customer-users/', views.list_customer_users),
    path('update-user-info/', views.update_user_info),
    path('get-user-email/', views.get_user_email),
    path('reset-user-email/', views.reset_user_email),
    path('reset-user-password/', views.reset_user_password),
    path('upload-profile-picture/', views.upload_profile_picture),
    path('shipping-addresses/', views.list_shipping_addresses),
    path('shipping-addresses/create/', views.create_shipping_address),
    path('shipping-addresses/<int:pk>/update/', views.update_shipping_address),
    path('shipping-addresses/<int:pk>/delete/', views.delete_shipping_address),
    path('shipping-addresses/<int:pk>/set-default/', views.set_default_shipping_address),
]

