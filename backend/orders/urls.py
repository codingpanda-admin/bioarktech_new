from django.urls import path

from . import views
from orders.views import CartAPI

urlpatterns = [
    path('create/', views.create_order, name='create'),
    path('capture/<str:order_id>', views.capture_order, name='capture'),
    path('capture/po/<str:order_id>', views.capture_order_po, name='capture_po'),
    path('cart/', CartAPI.as_view(), name='cart'),
    path('pay-with-purchase-order/', views.pay_with_purchase_order, name='purchase_order'),
    path('cart/add-quote-to-cart/<str:quote_number>', views.add_quote_to_cart, name='quote_to_cart'),
    path('get-invoice/<str:order_number>', views.get_invoice, name='get_invoice'),
]