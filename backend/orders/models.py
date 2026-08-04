from django.db import models
from datetime import datetime
from django.conf import settings
from products.models import Product
from products.serializers import ProductSerializer
from users.models import User, Address

from decimal import Decimal

class Quote(models.Model):
    request_date = models.DateTimeField()
    quote_number = models.CharField()
    quote_file = models.FileField(upload_to='quote_files/')
    description = models.TextField(blank=True, null=True)
    shelf_status = models.BooleanField()
    quantity = models.IntegerField()
    unit_size = models.CharField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    price = models.DecimalField(decimal_places=2, max_digits=10)
    total_price = models.DecimalField(decimal_places=2, max_digits=10)
    work_period_days = models.IntegerField(blank=True, null=True)
    # additional fields required by cart
    product_sku = models.CharField(max_length=30)
    product_name = models.CharField(default="Product Name")
    url = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'quotes'

class Invoice(models.Model):
    order_placed_date = models.DateTimeField(default=datetime.now)
    order_number = models.CharField()
    order_status = models.CharField(default='Effective')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service_finished = models.BooleanField(default=False)
    invoice_sent = models.BooleanField(default=False)
    delivery_date = models.DateField(null=True, blank=True)
    billing_date = models.DateField() 
    invoice_number = models.CharField()
    invoice_due = models.DecimalField(decimal_places=2, max_digits=10)
    po_file = models.FileField(upload_to='po_files/')
    po_number = models.CharField()
    po_address = models.ForeignKey(Address, on_delete=models.CASCADE, related_name="po_invoices")
    billing_address = models.ForeignKey(Address, on_delete=models.CASCADE, null=True, blank=True, related_name="billing_invoices")
    shipping_address = models.ForeignKey(Address, on_delete=models.CASCADE, related_name="shipping_invoices")
    # credit billing
    payment_token = models.CharField(blank=True, null=True)
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)
    receipt_number = models.CharField()
    invoice_payment = models.DecimalField(decimal_places=2, max_digits=10, default=0)

    class Meta:
        db_table = 'invoices'


class Order(models.Model):
    # required fields
    order_id = models.AutoField(primary_key=True)
    payment_token = models.CharField()
    subtotal = models.DecimalField(max_digits=8, decimal_places=2)
    shipping_amount = models.DecimalField(max_digits=8, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    total_paid = models.DecimalField(max_digits=8, decimal_places=2)
    minimum_payment = models.DecimalField(max_digits=8, decimal_places=2)
    payment_source = models.CharField()
    quantity = models.IntegerField()
    shipping_address = models.ForeignKey(Address, on_delete=models.CASCADE, related_name="shipping_orders")
    billing_address = models.ForeignKey(Address, on_delete=models.CASCADE, related_name="billing_orders")
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    # optional fields
    order_placed_date = models.DateTimeField(default=datetime.now)
    last_digits = models.DecimalField(max_digits=4, decimal_places=0, blank=True, null=True)
    delivery_date = models.DateField(null=True, blank=True)
    billing_date = models.DateField(null=True, blank=True)
    order_process_date = models.DateTimeField(blank=True, null=True)
    discount_code = models.CharField(null=True, blank=True)
    transaction_status = models.CharField(null=True, blank=True)
    fulfilled = models.BooleanField(default=True)
    refunded = models.BooleanField(default=False)
    paid = models.BooleanField(default=True)
    notes = models.CharField(blank=True, null=True)
    # PO billing information
    invoice = models.OneToOneField(Invoice, on_delete=models.CASCADE, blank=True, null=True)
    invoice_number = models.CharField(blank=True, null=True)
    invoice_amount = models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True)
    invoice_maximum_amount = models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True)
    po_number = models.CharField(blank=True, null=True)
    po_address = models.ForeignKey(Address, on_delete=models.CASCADE, related_name="po_orders", blank=True, null=True)
    receipt_number = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'orders'


class OrderItem(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('ready_for_delivery', 'Ready For Delivery'),
        ('invoiced', 'Invoiced'),
        ('paid', 'Paid'),
    ]
    # required fields
    order_item_id = models.AutoField(primary_key=True)
    order_class = models.CharField(default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    order_placed_date = models.DateTimeField(default=datetime.now)
    product_sku = models.CharField(max_length=30)
    product_name = models.CharField(default="Product Name")
    unit_price = models.DecimalField(decimal_places=2, max_digits=10)
    total_price = models.DecimalField(decimal_places=2, max_digits=10)
    quantity = models.IntegerField(default=0)
    # optional fields
    unit_size = models.CharField(blank=True, null=True)
    url = models.CharField(blank=True, null=True)
    work_period = models.CharField(blank=True, null=True)
    est_delivery_date = models.DateField(blank=True, null=True)
    order_process_date = models.DateTimeField(blank=True, null=True)
    shipping_date = models.DateField(null=True, blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    billing_date = models.DateField(null=True, blank=True)
    transaction_status = models.CharField(blank=True)
    ready_status = models.CharField(blank=True, null=True)
    fulfilled = models.BooleanField(default=False)
    refunded = models.BooleanField(default=False)
    paid = models.BooleanField(default=True)
    adjusted_price = models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True)
    discount_code = models.CharField(blank=True, null=True, max_length=20)
    # attribute names
    function_type_name = models.CharField(blank=True, null=True)
    structure_type_name = models.CharField(blank=True, null=True)
    promoter_name = models.CharField(blank=True, null=True)
    protein_tag_name = models.CharField(blank=True, null=True)
    fluorescene_marker_name = models.CharField(blank=True, null=True)
    selection_marker_name = models.CharField(blank=True, null=True)
    bacterial_marker_name = models.CharField(blank=True, null=True)
    target_sequence = models.CharField(blank=True, null=True)
    delivery_format_name = models.CharField(blank=True, null=True)
    order = models.ForeignKey(Order, on_delete=models.PROTECT)

    class Meta:
        db_table = 'order_item'


class CloningCRISPRItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Cloning CRISPR Order Item'


class CloningOverexpressionItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Cloning Overexpression Order Item'


class CloningRNAiItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Cloning RNAi Order Item'

class OpenOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking Open Order'

class CRISPRInProgressOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking In Progress CRISPR Order'

class OverexpressionInProgressOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking In Progress Overexpression Order'

class RNAiInProgressOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking In Progress RNAi Order'

class ReagentInProgressOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking In Progress Reagents Order'

class OtherInProgressOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking In Progress Other Order'

class FinalizedOrderItem(OrderItem):
    class Meta:
        proxy = True
        verbose_name = 'Tracking Finalized Order'


class CartItem(models.Model):
    # required fields
    product_sku = models.CharField(max_length=30)
    product_name = models.CharField(default="Product Name")
    price = models.DecimalField(decimal_places=2, max_digits=10)
    quantity = models.IntegerField(default=0)
    # optional fields
    url = models.CharField(blank=True, null=True)
    unit_size = models.CharField(blank=True, null=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    ready_status = models.CharField(blank=True, null=True)
    adjusted_price = models.DecimalField(decimal_places=2, max_digits=10, blank=True, null=True)
    discount_code = models.CharField(max_length=20, null=True, blank=True)
    # attribute names - optional
    function_type_name = models.CharField(blank=True, null=True)
    structure_type_name = models.CharField(blank=True, null=True)
    promoter_name = models.CharField(blank=True, null=True)
    protein_tag_name = models.CharField(blank=True, null=True)
    fluorescene_marker_name = models.CharField(blank=True, null=True)
    selection_marker_name = models.CharField(blank=True, null=True)
    bacterial_marker_name = models.CharField(blank=True, null=True)
    target_sequence = models.CharField(blank=True, null=True)
    delivery_format_name = models.CharField(blank=True, null=True)

    def get_total_price(self):
        return self.product.price * self.quantity

class Cart(object):
    def __init__(self, request):
        """
        Initialize the cart
        """
        self.session = request.session
        cart = self.session.get(settings.CART_SESSION_ID)
        if not cart:
            # save an empty cart in session
            cart = self.session[settings.CART_SESSION_ID] = []
        self.cart = cart

    def save(self):
        self.session.modified = True

    def add(self, cart_item=None, quantity=1, override_quantity=False):
        """
        Add product to the cart or update its quantity
        """
        cart_item, created = CartItem.objects.get_or_create(session_key=self.session.session_key, **cart_item)
        if created:
            self.cart.append(cart_item.id)
        
        if override_quantity:
            cart_item.quantity = quantity
        else:
            cart_item.quantity += quantity
        
        cart_item.save()
        self.save()

    def remove(self, product_id):
        """
        Remove a product from the cart
        """
        if product_id in self.cart:
            CartItem.objects.get(id=product_id).delete()
            self.cart.remove(product_id)
            self.save()
    
    def updateQuantity(self, product_id, quantity):
        """
        Remove a product from the cart
        """
        if product_id in self.cart:
            cart_item = CartItem.objects.get(id=product_id)
            cart_item.quantity = quantity
            cart_item.save()
            self.save()

    def __iter__(self):
        """
        Loop through cart items and fetch the products from the database
        """
        from orders.serializers import CartItemSerializer
        cart_items = CartItem.objects.filter(id__in=self.cart).order_by('-id')
        serializer = CartItemSerializer(cart_items, many=True)
        
        return serializer.data

    def __len__(self):
        """
        Count all items in the cart
        """
        return sum(CartItem.objects.get(id=item_id).quantity for item_id in self.cart)

    def get_total_price(self):
        return sum(CartItem.objects.get(id=item_id).price * CartItem.objects.get(id=item_id).quantity for item_id in self.cart)

    def clear(self):
        # clear cart items in session
        CartItem.objects.filter(session_key=self.session.session_key).delete()
        cart = self.session[settings.CART_SESSION_ID] = []
        self.cart = cart
        self.save()

class WorkSchedule(models.Model):
    structure_type_code = models.CharField()
    delivery_format_code = models.CharField()
    ready_status = models.CharField()
    work_period_earliest = models.IntegerField() # estimate time of arrival in days
    work_period_latest = models.IntegerField(blank=True, null=True)
    shipping_temp = models.CharField()
    storage_temp = models.CharField()
    stability_period = models.CharField()

    class Meta:
        db_table = 'work_schedule'
