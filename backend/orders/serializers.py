from rest_framework import serializers
from orders.models import *
from users.serializers import *

class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    # TODO: product_link and invoice file
    order_placed_date = serializers.SerializerMethodField()
    class Meta:
        model = OrderItem
        fields = ['order_class', 'order_id', 'order_placed_date', 'work_period', 'est_delivery_date', 'product_sku', 'product_name', 'unit_size', 'quantity', 'total_price', 'status', 'function_type_name', 'structure_type_name', 'promoter_name', 'protein_tag_name', 'fluorescene_marker_name', 'selection_marker_name', 'bacterial_marker_name', 'target_sequence', 'delivery_format_name', 'url']

    def get_order_placed_date(self, obj):
        order = Order.objects.get(order_id=obj.order_id)
        return order.order_placed_date.date()

class OrderSerializer(serializers.ModelSerializer):
    shipping_address = AddressSerializer()
    billing_address = AddressSerializer()
    user = UserSerializer()
    
    class Meta:
        model = Order
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['invoice_number', 'billing_date', 'invoice_due', 'shipping_address', 'billing_address']