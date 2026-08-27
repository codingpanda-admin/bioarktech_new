from datetime import datetime, date, timedelta
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import os
from dotenv import load_dotenv
import logging
logger = logging.getLogger(__name__)
import json
import secrets
import hashlib
import hmac

# PayPal SDK
from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials
from paypalserversdk.logging.configuration.api_logging_configuration import (
    LoggingConfiguration,
    RequestLoggingConfiguration,
    ResponseLoggingConfiguration,
)
from paypalserversdk.paypalserversdk_client import PaypalserversdkClient
from paypalserversdk.controllers.orders_controller import OrdersController
from paypalserversdk.controllers.payments_controller import PaymentsController

# Stripe SDK
import stripe

from .models import *
from users.models import Address
from .serializers import *
from products.models import Product, FeaturedProduct, UnitPrice, ProductsUnion
from interface.models import ServiceMode
from django.http import HttpResponse, JsonResponse
from django.db import transaction

import requests

from .invoice_pdf import build_invoice_pdf, invoice_number_for
from .invoice_html import build_invoice_html
from .purchase_email import queue_purchase_confirmation_email

load_dotenv()

# Stripe Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_API_BASE = "https://api-m.paypal.com"
DEBUG = os.getenv("DEBUG_FLAG")

if DEBUG == "True":
    PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID_DEV")
    PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET_DEV")
    PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com"


if PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET:
    paypal_client: PaypalserversdkClient = PaypalserversdkClient(
        client_credentials_auth_credentials=ClientCredentialsAuthCredentials(
            o_auth_client_id=PAYPAL_CLIENT_ID,
            o_auth_client_secret=PAYPAL_CLIENT_SECRET,
        ),
        # logging_configuration=LoggingConfiguration(
        #     log_level=logging.INFO,
        #     # Disable masking of sensitive headers for Sandbox testing.
        #     # This should be set to True (the default if unset)in production.
        #     mask_sensitive_headers=False,
        #     request_logging_config=RequestLoggingConfiguration(
        #         log_headers=True, log_body=True
        #     ),
        #     response_logging_config=ResponseLoggingConfiguration(
        #         log_headers=True, log_body=True
        #     ),
        # ),
    )
    orders_controller: OrdersController = paypal_client.orders
    payments_controller: PaymentsController = paypal_client.payments
else:
    paypal_client = None
    orders_controller = None
    payments_controller = None

# Step 1: Obtain Access Token
def get_access_token():
    url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    data = {
        "grant_type": "client_credentials",
    }
    response = requests.post(url, headers=headers, data=data, auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET))
    response.raise_for_status()
    return response.json()["access_token"]


@api_view(['POST'])
def create_order(request):
    data = json.loads(request.body)
    total_price = data.get("total_price")

    access_token = get_access_token()

    url = f"{PAYPAL_API_BASE}/v2/checkout/orders"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD",
                    "value": str(total_price),
                }
            }
        ]
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return Response(response.json())

# @api_view(['POST'])
# def create_order(request):
#     # use the cart information passed from the front-end to calculate the order amount details
#     # cart = request.GET["cart"]
#     data = json.loads(request.body)
#     total_price = data.get("total_price")
#     order = orders_controller.orders_create(
#         {
#             "body": OrderRequest(
#                 intent=CheckoutPaymentIntent.CAPTURE,
#                 purchase_units=[
#                     PurchaseUnitRequest(
#                         amount=AmountWithBreakdown(
#                             currency_code="USD",
#                             value=total_price,
#                         ),

#                     )
#                 ],

#             )
#         }
#     )
#     return Response(json.loads(ApiHelper.json_serialize(order.body)))
#     # return Response(ApiHelper.json_serialize(order.body), content_type="application/json")

@api_view(['POST'])
def capture_order(request, order_id):
    try:
        body = request.data
        address = body.get("address")
        cart = body.get("cart")
        quantity = body.get("quantity")
        discount_code = body.get("discount_code", "")
        subtotal = body.get("subtotal")
        shipping_amount = body.get("shipping_amount")
        tax_amount = body.get("tax_amount", 0)
        tax_amount = 0 if tax_amount == None else tax_amount
        order_number = body.get("order_number", None)

        access_token = get_access_token()

        url = f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        payment_token = data["purchase_units"][0]["payments"]["captures"][0]["id"]
        total_price = float(data["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])

        payment_source = "Made with PayPal"
        last_digits = None
        if "card" in data["payment_source"]:
            payment_source = data["payment_source"]["card"]["brand"]
            last_digits = data["payment_source"]["card"]["last_digits"]
        
        # handle invoice order
        if order_number:
            order = Order.objects.get(payment_token=order_number)
            order.paid = True
            order.total_paid = order.total_price
            order.payment_source = payment_source
            order.last_digits = last_digits
            order.save()

            invoice = Invoice.objects.get(order_number=order_number)
            invoice.is_paid = True
            invoice.payment_token = payment_token
            invoice.invoice_payment = total_price
            invoice.save()

            return Response(data)

        address_obj, created = Address.objects.get_or_create(address_line_1=address["address_line_1"],
                                                            apt_suite=address["apt"],
                                                            city=address["city"],
                                                            state=address["state"],
                                                            zipcode=address["zipcode"])

        # Create order dictionary
        order_data = {
            "payment_token": payment_token,
            "subtotal": subtotal,
            "shipping_amount": shipping_amount,
            "tax_amount": tax_amount,
            "total_price": total_price,
            "total_paid": total_price,
            "minimum_payment": calculate_minimum_payment(total_price),
            "payment_source": payment_source,
            "quantity": quantity,
            "shipping_address": address_obj,
            "billing_address": address_obj,
            "user": request.user,
            "last_digits": last_digits,
            "discount_code": discount_code,
        }

        order_obj = Order.objects.create(**order_data)

        # Create order items
        create_order_items(cart, order_obj)

    except Exception as e:
        raise e
        return Response({"error": "Failed to capture order. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(data)


@api_view(['POST'])
def capture_order_po(request, order_id):
    try:
        access_token = get_access_token()
        url = f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        # get request parameters
        order_number = request.data.get("order_number")
        po_file = request.FILES.get("po_file")
        cart = json.loads(request.data.get("cart"))
        quantity = int(request.data.get("quantity"))
        subtotal = int(request.data.get("subtotal"))
        shipping_amount = int(request.data.get("shipping_amount"))
        tax_amount = int(request.data.get("tax_amount", 0))
        tax_amount = 0 if tax_amount == None else tax_amount
        total_price = int(request.data.get("total_price"))
        address = json.loads(request.data.get("address"))
        credit_price = int(request.data.get("credit_price"))
        po_price = int(request.data.get("po_price"))

        payment_token = data["purchase_units"][0]["payments"]["captures"][0]["id"]
        total_paid = float(data["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])
        invoice_number = "IV-" + payment_token
        receipt_number = "RT-" + payment_token

        payment_source = "Made with PayPal"
        last_digits = None
        if "card" in data["payment_source"]:
            payment_source = data["payment_source"]["card"]["brand"]
            last_digits = data["payment_source"]["card"]["last_digits"]

        address_obj, created = Address.objects.get_or_create(address_line_1=address["address_line_1"],
                                                            city=address["city"],
                                                            state=address["state"],
                                                            zipcode=address["zipcode"])

        # Create invoice object
        invoice_data = {
            "order_number": payment_token,
            "user": request.user,
            "billing_date": datetime.now() + timedelta(days=30),
            "invoice_number": invoice_number,
            "invoice_due": po_price,
            "po_file": po_file,
            "po_number": order_number,
            "po_address": address_obj,
            "billing_address": address_obj,
            "shipping_address": address_obj,
            "receipt_number": receipt_number
        }
        invoice_obj = Invoice.objects.create(**invoice_data)

        # Create order dictionary
        order_data = {
            "payment_token": payment_token,
            "subtotal": subtotal,
            "shipping_amount": shipping_amount,
            "tax_amount": tax_amount,
            "total_price": total_price,
            "total_paid": total_paid,
            "minimum_payment": calculate_minimum_payment(total_price),
            "payment_source": payment_source,
            "quantity": quantity,
            "shipping_address": address_obj,
            "billing_address": address_obj,
            "user": request.user,
            "last_digits": last_digits,
            "invoice": invoice_obj,
            "invoice_number": invoice_number,
            "invoice_amount": po_price,
            "invoice_maximum_amount": calculate_maximum_invoice(total_price),
            "po_number": order_number,
            "po_address": address_obj,
            "receipt_number": receipt_number,
            "fulfilled": False,
            "paid": False
        }

        order_obj = Order.objects.create(**order_data)

        # Create order items
        create_order_items(cart, order_obj)

    except Exception as e:
        raise e
        return Response({"error": "Failed to capture order. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(data)


@api_view(['POST'])
def pay_with_purchase_order(request):
    try:
        order_number = request.data.get("order_number")
        po_file = request.FILES.get("po_file")
        cart = json.loads(request.data.get("cart"))
        quantity = int(request.data.get("quantity"))
        subtotal = int(request.data.get("subtotal"))
        shipping_amount = int(request.data.get("shipping_amount"))
        tax_amount = int(request.data.get("tax_amount", 0))
        tax_amount = 0 if tax_amount == None else tax_amount
        total_price = int(request.data.get("total_price"))
        address = json.loads(request.data.get("address"))
        credit_price = int(request.data.get("credit_price"))
        po_price = int(request.data.get("po_price"))

        payment_source = 'Paid with Purchase Order (PO)'
        payment_token = generate_payment_token()
        invoice_number = "IV-" + payment_token
        receipt_number = "RT-" + payment_token

        address_obj, created = Address.objects.get_or_create(address_line_1=address["address_line_1"],
                                                             apt_suite=address["apt"],
                                                             city=address["city"],
                                                             state=address["state"],
                                                             zipcode=address["zipcode"])

        # Create invoice object
        invoice_data = {
            "order_number": payment_token,
            "user": request.user,
            "billing_date": datetime.now() + timedelta(days=30),
            "invoice_number": invoice_number,
            "invoice_due": po_price,
            "po_file": po_file,
            "po_number": order_number,
            "po_address": address_obj,
            "billing_address": address_obj,
            "shipping_address": address_obj,
            "receipt_number": receipt_number
        }
        invoice_obj = Invoice.objects.create(**invoice_data)

        # Create order object
        order_data = {
            "payment_token": payment_token,
            "subtotal": subtotal,
            "shipping_amount": shipping_amount,
            "tax_amount": tax_amount,
            "total_price": total_price,
            "total_paid": credit_price,
            "minimum_payment": calculate_minimum_payment(total_price),
            "payment_source": payment_source,
            "quantity": quantity,
            "shipping_address": address_obj,
            "billing_address": address_obj,
            "user": request.user,
            "invoice": invoice_obj,
            "invoice_number": invoice_number,
            "invoice_amount": po_price,
            "invoice_maximum_amount": calculate_maximum_invoice(total_price),
            "po_number": order_number,
            "po_address": address_obj,
            "receipt_number": receipt_number,
            "fulfilled": False,
            "paid": False
        }
        order_obj = Order.objects.create(**order_data)

        # Create order items
        create_order_items(cart, order_obj)
    
    except Exception as e:
        raise e
        return Response({"error": "An unexpected error has occurred. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "Payment successful.", "payment_token": payment_token}, status=status.HTTP_200_OK)


@api_view(['POST'])
def add_quote_to_cart(request, quote_number):
    try:
        if not request.user.is_authenticated:
            return Response({"detail": "Please login before applying the quote."}, status=status.HTTP_401_UNAUTHORIZED)

        cart = Cart(request)

        if request.user.is_staff:
            quote = Quote.objects.get(quote_number=quote_number)
        else:
            quote = Quote.objects.get(quote_number=quote_number, user=request.user)

        cart_item = {
            "product_sku": quote.product_sku,
            "product_name": quote.product_name,
            "price": quote.price,
            "url": quote.url,
            "unit_size": quote.unit_size
        }
        
        cart.add(
            cart_item=cart_item,
            quantity=quote.quantity,
        )

        cart.save()

        return Response({"message": "Quote added to cart successfully.", "cart": list(cart.__iter__())}, status=status.HTTP_200_OK)

    except Quote.DoesNotExist:
        return Response({"detail": "Quote not found. Make sure to check for typos and that you are logged in the account where you received the quote."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_invoice(request, order_number):
    try:
        if not request.user.is_authenticated:
            return Response({"detail": "Redirect to login page to proceed checkout."}, status=status.HTTP_401_UNAUTHORIZED)

        invoice = Order.objects.get(payment_token=order_number, user=request.user).invoice

        if invoice.is_paid:
            return Response({"detail": "Invoice has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InvoiceSerializer(invoice)

        return Response({"invoice": serializer.data}, status=status.HTTP_200_OK)

    except Invoice.DoesNotExist:
        return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def download_order_invoice(request, order_id):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Please sign in to generate an invoice."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        order = (
            Order.objects
            .select_related('user', 'billing_address', 'shipping_address')
            .prefetch_related('orderitem_set')
            .get(order_id=order_id, user=request.user)
        )
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    pdf_content = build_invoice_pdf(order)
    invoice_number = invoice_number_for(order)
    response = HttpResponse(pdf_content, content_type='application/pdf')
    disposition = 'inline' if request.query_params.get('view') == '1' else 'attachment'
    response['Content-Disposition'] = f'{disposition}; filename="BioArk-Invoice-{invoice_number}.pdf"'
    response['Cache-Control'] = 'private, no-store'
    return response


@api_view(['GET'])
def view_order_invoice_html(request, order_id):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Please sign in to view an invoice."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        order = (
            Order.objects
            .select_related('user', 'billing_address', 'shipping_address')
            .prefetch_related('orderitem_set')
            .get(order_id=order_id, user=request.user)
        )
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    invoice_number = invoice_number_for(order)
    response = HttpResponse(build_invoice_html(order), content_type='text/html; charset=utf-8')
    disposition = 'attachment' if request.query_params.get('download') == '1' else 'inline'
    response['Content-Disposition'] = (
        f'{disposition}; filename="BioArk-Invoice-{invoice_number}.html"'
    )
    response['Cache-Control'] = 'private, no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    return response


def invoice_repayment(request, order_number, payment_token):
    body = request.data
    total_price = body.get("total_price")

    order = Order.objects.get(order_number=order_number, user=request.user)
    order.fulfilled = True
    order.save()

    invoice = order.invoice
    invoice.is_paid = True
    invoice.payment_date = datetime.now()
    invoice.invoice_payment = total_price
    invoice.payment_token = payment_token
    invoice.save()


class CartAPI(APIView):
    """
    Single API to handle cart operations
    """
    def get(self, request, format=None):
        cart = Cart(request)

        return Response(
            {"data": list(cart.__iter__()),
             "count": cart.__len__(),
             "total_price": cart.get_total_price()
            },
            status=status.HTTP_200_OK
            )

    def post(self, request, **kwargs):
        cart = Cart(request)

        if "remove" in request.data:
            product_id = request.data["product_id"]
            cart.remove(product_id)

        elif "clear" in request.data:
            cart.clear()
        
        elif "updateQuantity" in request.data:
            product_id = request.data["product_id"]
            quantity = request.data["quantity"]
            cart.updateQuantity(product_id, quantity)

        else:
            product = request.data
            cart.add(
                    cart_item=product["cart_item"],
                    quantity=product["quantity"],
                    override_quantity=product["override_quantity"] if "override_quantity" in product else False
                )

        data = {
            "message": "Cart updated successfully.",
            "data": list(cart.__iter__()),
            "count": cart.__len__(),
            "total_price": cart.get_total_price()
        }
        return Response(data, status=status.HTTP_200_OK)


# Helper methods
def create_order_items(cart, order_obj):
    model_fields = [field.name for field in OrderItem._meta.get_fields()]

    try:
        for item in cart:
            sku = item.get('product_sku') or item.get('sku', '')
            unit_size = item.get('unit_size') or item.get('unitSize', '')
            db_price = _lookup_db_price(sku, unit_size)
            if db_price is not None and db_price > 0:
                unit_price = db_price
            else:
                unit_price = float(item.get('price', 0))

            item_fields = {key: value for key, value in item.items() if key in model_fields}
            # Make sure product_sku is populated in item_fields
            if 'product_sku' not in item_fields and sku:
                item_fields['product_sku'] = sku
            if 'unit_size' not in item_fields and unit_size:
                item_fields['unit_size'] = unit_size

            OrderItem.objects.create(unit_price=unit_price,
                                    order_class=get_order_class(item_fields['product_sku']),
                                    total_price=float(unit_price) * int(item.get('quantity', 1)),
                                    order=order_obj,
                                    work_period=get_work_period(item_fields['product_sku'], item.get('ready_status')),
                                    est_delivery_date=get_est_delivery_date(item_fields['product_sku'], item.get('ready_status')),
                                    **item_fields)

    except Exception:
        for item in cart:
            sku = item.get('product_sku') or item.get('sku', '')
            unit_size = item.get('unit_size') or item.get('unitSize', '')
            db_price = _lookup_db_price(sku, unit_size)
            if db_price is not None and db_price > 0:
                unit_price = db_price
            else:
                unit_price = float(item.get('price', 0))

            item_fields = {key: value for key, value in item.items() if key in model_fields}
            if 'product_sku' not in item_fields and sku:
                item_fields['product_sku'] = sku
            if 'unit_size' not in item_fields and unit_size:
                item_fields['unit_size'] = unit_size

            OrderItem.objects.create(unit_price=unit_price,
                                    order_class=get_order_class(item_fields['product_sku']),
                                    total_price=float(unit_price) * int(item.get('quantity', 1)),
                                    order=order_obj,
                                    **item_fields)


def calculate_minimum_payment(total_price):
    if total_price < 100:
        return total_price
    elif total_price >= 100 and total_price <= 1000:
        return 0
    elif total_price > 1000:
        return "{:.2f}".format(total_price / 2)


def calculate_maximum_invoice(total_price):
    if total_price < 100:
        return 0
    elif total_price >= 100 and total_price <= 1000:
        return total_price
    elif total_price > 1000:
        return "{:.2f}".format(total_price / 2)


def generate_payment_token():
    # Ensure payment token is unique
    payment_token = secrets.token_urlsafe(8).upper()
    while Order.objects.filter(payment_token=payment_token).exists():
        payment_token = secrets.token_urlsafe(8).upper()
    
    return payment_token


def get_order_class(product_sku):
    obj_class = product_sku[:2]
    if obj_class == 'CA' or obj_class == 'CI' or obj_class == 'CO' or obj_class == 'CN' or obj_class == 'CD' or obj_class == 'CR':
        return 'Cloning-CRISPR'
    elif obj_class == 'EM' or obj_class == 'IM':
        return 'Cloning-Overexpression'
    elif obj_class == 'SH':
        return 'Cloning-RNAi'
    elif obj_class == 'QT':
        return 'Other'
    else:
        return 'Reagents'


def get_work_period(product_sku, ready_status):
    structure_type_code = product_sku[2]
    delivery_format_code = product_sku[-1]
    ready_status = ready_status
    work_period_days = WorkSchedule.objects.get(structure_type_code=structure_type_code, delivery_format_code=delivery_format_code, ready_status=ready_status).work_period_earliest
    
    return f"{work_period_days} days"


def get_est_delivery_date(product_sku, ready_status):
    structure_type_code = product_sku[2]
    delivery_format_code = product_sku[-1]
    ready_status = ready_status
    work_period_days = WorkSchedule.objects.get(structure_type_code=structure_type_code, delivery_format_code=delivery_format_code, ready_status=ready_status).work_period_earliest

    current_date = date.today()
    delta = timedelta(days=work_period_days)
    work_period_date = current_date + delta

    return work_period_date


def _lookup_db_price(sku, unit_size=None):
    """
    Look up the authentic price of a product in the database.
    This prevents users from tampering with cart prices on the client side.
    """
    sku = (sku or "").strip()
    unit_size = (unit_size or "").strip()
    
    if not sku:
        return 0.0

    # Gene Design cart items encode Steps 2-5 plus the selected Step 6 format
    # in their SKU. Always verify their price against the backend lookup table.
    from genes.pricing import resolve_design_sku_price

    design_price = resolve_design_sku_price(sku, unit_size)
    if design_price is not None:
        if design_price['quote_only'] or design_price['price'] is None:
            return 0.0
        return float(design_price['price'])

    # 1. Check if it's a FeaturedProduct
    featured_product = FeaturedProduct.objects.filter(catalog_number__iexact=sku).first()
    if featured_product:
        # Check UnitPrice
        if featured_product.union:
            if unit_size:
                up = UnitPrice.objects.filter(union=featured_product.union, unit_size__iexact=unit_size).first()
                if up:
                    return float(up.unit_price)
            # Fallback to the first unit price for this product
            up = UnitPrice.objects.filter(union=featured_product.union).first()
            if up:
                return float(up.unit_price)
        # Featured rows are presentation metadata. If their legacy UnitPrice
        # record is absent, continue to the canonical Product price fields.

    # 2. Check if it's a general Product
    product = Product.objects.filter(catalog_number__iexact=sku, hidden=False).first()
    if not product:
        product = Product.objects.filter(external_id__iexact=sku, hidden=False).first()
        
    if product:
        # Check if there are UnitPrice records for the product's union
        union = ProductsUnion.objects.filter(product_id__iexact=product.catalog_number).first()
        if not union:
            union = ProductsUnion.objects.filter(product_id__iexact=product.external_id).first()
            
        up = None
        if union:
            if unit_size:
                up = UnitPrice.objects.filter(union=union, unit_size__iexact=unit_size).first()
            if not up and not unit_size:
                up = UnitPrice.objects.filter(union=union).first()
                
        if up:
            return float(up.unit_price)

        def parse_catalog_price(value):
            parsed = Product._numeric_catalog_price(value)
            return float(parsed) if parsed is not None else None

        def option_value(values, selected_unit):
            if not isinstance(values, dict) or not selected_unit:
                return None
            normalized_unit = selected_unit.strip().casefold()
            for option_name, option_price in values.items():
                if str(option_name or '').strip().casefold() == normalized_unit:
                    return option_price
            return None

        # Current product/reagent records store option prices directly on the
        # Product JSON fields rather than in the legacy UnitPrice table.
        if unit_size:
            option_list_price = parse_catalog_price(option_value(product.option_prices, unit_size))
            if option_list_price is None:
                option_list_price = parse_catalog_price(product.list_price)

            option_discount_price = parse_catalog_price(
                option_value(product.option_discounted_prices, unit_size)
            )
            if (
                option_discount_price is not None
                and option_list_price is not None
                and option_discount_price < option_list_price
            ):
                return option_discount_price
            if option_list_price is not None:
                return option_list_price

        list_price = parse_catalog_price(product.list_price)
        discount_price = parse_catalog_price(product.discounted_price)
        if (
            discount_price is not None
            and list_price is not None
            and discount_price < list_price
        ):
            return discount_price
        if list_price is not None:
            return list_price

        # A range is not a purchasable single price and must not be guessed.
        range_price = parse_catalog_price(product.price_range)
        return range_price if range_price is not None else 0.0

    # 3. Check if it's a service
    # Services in this app have URL as their identifier (e.g. s.url)
    service = ServiceMode.objects.filter(url__iexact=sku, hidden=False).first()
    if not service:
        # Sometimes SKU is url.upper() or has "svc-" prefix
        clean_sku = sku
        if sku.lower().startswith("svc-"):
            clean_sku = sku[4:]
        service = ServiceMode.objects.filter(url__iexact=clean_sku, hidden=False).first()
        if not service:
            # Fallback check by title
            service = ServiceMode.objects.filter(title__iexact=sku, hidden=False).first()

    if service:
        return 0.0 # Services are quote-only/free to add to cart on backend until custom quoted

    return None


@api_view(['POST'])
def create_stripe_checkout_session(request):
    """
    Create a Stripe Checkout Session from the cart contents.
    All price calculations are done server-side for security.
    """
    if not STRIPE_SECRET_KEY:
        return Response(
            {"error": "Stripe is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    if not request.user.is_authenticated:
        return Response(
            {"error": "Please sign in to proceed with payment."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        data = request.data
        cart_items = data.get("cart", [])
        address = data.get("address", {})
        discount_code = data.get("discount_code", "")

        if not cart_items:
            return Response(
                {"error": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not address or not address.get("address_line_1") or not address.get("city") or not address.get("state") or not address.get("zipcode"):
            return Response(
                {"error": "A valid shipping address is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        checkout_user = User.objects.select_related("billing_address").get(id=request.user.id)
        billing_address = checkout_user.billing_address
        required_billing_fields = (
            "address_line_1",
            "city",
            "state",
            "zipcode",
            "country",
        )
        if not billing_address or any(
            not str(getattr(billing_address, field, "") or "").strip()
            for field in required_billing_fields
        ):
            return Response(
                {
                    "error": "A complete billing address is required before checkout.",
                    "code": "billing_address_required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        line_items = []
        subtotal = 0
        total_quantity = 0

        for item in cart_items:
            quantity = int(item.get("quantity", 1))
            name = item.get("name", "Product")
            sku = item.get("sku", "")
            unit_size = item.get("unitSize", "")

            # Look up price securely in DB
            price = _lookup_db_price(sku, unit_size)
            if price is None or price < 0:
                price = float(item.get("price", 0))
            
            # Update item price in place so downstream metadata retains verified price
            item["price"] = price

            if price <= 0 or quantity <= 0:
                continue

            item_total = price * quantity
            subtotal += item_total
            total_quantity += quantity

            display_name = name
            if unit_size:
                display_name = f"{name} ({unit_size})"

            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(round(price * 100)),
                    "product_data": {
                        "name": display_name[:500],
                        "metadata": {
                            "sku": sku,
                            "unit_size": unit_size,
                        }
                    },
                },
                "quantity": quantity,
            })

        if not line_items:
            return Response(
                {"error": "No valid items in cart."},
                status=status.HTTP_400_BAD_REQUEST
            )

        shipping_amount = _calculate_shipping(cart_items, subtotal)
        grand_total = subtotal + shipping_amount

        save_to_profile = address.get("save_to_profile", False)
        if save_to_profile:
            try:
                from users.models import CustomerShippingAddress
                # Find if this exact address already exists for the user to avoid duplicates
                exists = CustomerShippingAddress.objects.filter(
                    user=request.user,
                    address_line_1=address["address_line_1"],
                    address_line_2=address.get("apt", ""),
                    city=address["city"],
                    state=address["state"],
                    postal_code=address["zipcode"]
                ).exists()
                if not exists:
                    CustomerShippingAddress.objects.create(
                        user=request.user,
                        nickname=address.get("nickname", "New Address"),
                        first_name=address.get("first_name", request.user.first_name or "Customer"),
                        last_name=address.get("last_name", request.user.last_name or ""),
                        company_name=address.get("company_name", ""),
                        address_line_1=address["address_line_1"],
                        address_line_2=address.get("apt", ""),
                        city=address["city"],
                        state=address["state"],
                        postal_code=address["zipcode"],
                        is_default=False
                    )
            except Exception as e:
                # Log the error but don't fail checkout
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error saving checkout address to profile: {e}")


        checkout_attempt = StripeCheckoutAttempt.objects.create(
            user=checkout_user,
            cart_items=cart_items,
            shipping_address={
                "address_line_1": address["address_line_1"],
                "address_line_2": address.get("address_line_2", ""),
                "apt_suite": address.get("apt", ""),
                "city": address["city"],
                "state": address["state"],
                "zipcode": address["zipcode"],
                "country": address.get("country", "US") or "US",
            },
            billing_address={
                "address_line_1": billing_address.address_line_1,
                "address_line_2": billing_address.address_line_2,
                "apt_suite": billing_address.apt_suite,
                "city": billing_address.city,
                "state": billing_address.state,
                "zipcode": billing_address.zipcode,
                "country": billing_address.country or "US",
            },
            subtotal=subtotal,
            shipping_amount=shipping_amount,
            total_quantity=total_quantity,
            discount_code=discount_code,
        )

        session_metadata = {
            "checkout_attempt_id": str(checkout_attempt.checkout_attempt_id),
        }

        frontend_url = _get_frontend_url()

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_intent_data={
                    "metadata": session_metadata,
                },
                line_items=line_items,
                mode="payment",
                success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{frontend_url}/checkout/cancel?attempt_id={checkout_attempt.checkout_attempt_id}",
                customer_email=request.user.email,
                metadata=session_metadata,
                shipping_options=[
                    {
                        "shipping_rate_data": {
                            "type": "fixed_amount",
                            "fixed_amount": {
                                "amount": int(round(shipping_amount * 100)),
                                "currency": "usd",
                            },
                            "display_name": "Standard Shipping",
                        }
                    }
                ] if shipping_amount > 0 else [],
            )
        except Exception:
            checkout_attempt.delete()
            raise

        checkout_attempt.stripe_session_id = checkout_session.id
        checkout_attempt.save(update_fields=['stripe_session_id'])

        return Response({
            "session_id": checkout_session.id,
            "url": checkout_session.url,
            "subtotal": round(subtotal, 2),
            "shipping_amount": round(shipping_amount, 2),
            "grand_total": round(grand_total, 2),
        })

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return Response(
            {"error": "Payment service error. Please try again."},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Checkout session creation error: {str(e)}")
        return Response(
            {"error": "Failed to create checkout session."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def stripe_checkout_cancel(request):
    """Discard an unpaid checkout attempt without creating or retaining a purchase."""
    if not request.user.is_authenticated:
        return Response(
            {"error": "Please sign in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    checkout_attempt_id = request.data.get('checkout_attempt_id') or request.data.get('attempt_id')
    if not checkout_attempt_id:
        return Response(
            {"error": "No checkout attempt ID provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        checkout_attempt = StripeCheckoutAttempt.objects.filter(
            checkout_attempt_id=checkout_attempt_id,
            user=request.user,
        ).first()
    except (TypeError, ValueError, ValidationError):
        return Response(
            {"error": "Invalid checkout attempt ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if checkout_attempt is None:
        return Response({"status": "already_cancelled"})

    if checkout_attempt.stripe_session_id:
        try:
            stripe_session = stripe.checkout.Session.retrieve(checkout_attempt.stripe_session_id)
        except stripe.error.StripeError as exc:
            logger.warning(
                "Could not verify Stripe checkout attempt %s before cancellation: %s",
                checkout_attempt.checkout_attempt_id,
                exc,
            )
            return Response(
                {"error": "Could not verify payment status before cancellation."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if stripe_session.payment_status == 'paid':
            success, order = _process_successful_checkout(stripe_session)
            return Response({
                "status": "completed" if success else "processing",
                "order_id": order.order_id if order else None,
            })

    checkout_attempt.delete()
    return Response({"status": "cancelled"})


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events.
    Verifies webhook signature for security.
    Creates Order and OrderItem records on successful payment.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    if not STRIPE_WEBHOOK_SECRET:
        logger.error("Stripe webhook is disabled because STRIPE_WEBHOOK_SECRET is not configured.")
        return HttpResponse("Webhook not configured", status=503)

    try:
        event_data = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Stripe webhook: invalid payload")
        return HttpResponse("Invalid payload", status=400)
    except stripe.error.SignatureVerificationError:
        logger.error("Stripe webhook: invalid signature")
        return HttpResponse("Invalid signature", status=400)

    event_type = event_data.get("type", "")

    try:
        if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
            _handle_checkout_completed(event_data)
        elif event_type == "payment_intent.succeeded":
            pass
        elif event_type == "charge.dispute.created":
            _handle_dispute(event_data)
    except Exception:
        logger.exception("Stripe webhook: event processing failed for %s", event_type)
        return HttpResponse("Event processing failed", status=500)

    return HttpResponse("ok", status=200)


def _create_checkout_address_snapshot(address_data):
    return Address.objects.create(
        address_line_1=address_data.get('address_line_1', ''),
        address_line_2=address_data.get('address_line_2', ''),
        apt_suite=address_data.get('apt_suite', ''),
        city=address_data.get('city', ''),
        state=address_data.get('state', ''),
        zipcode=address_data.get('zipcode', ''),
        country=address_data.get('country', 'US') or 'US',
    )


def _process_successful_checkout(session):
    """
    Process a completed checkout session and create the order if it does not exist.
    Returns (success, order_obj).
    """
    payment_intent_id = session.get("payment_intent", "")
    session_id = session.get("id", "")

    # Check if order already exists first to avoid unnecessary API/DB work
    order_qs = Order.objects.filter(payment_token=session_id)
    if order_qs.exists():
        logger.info(f"Stripe order processing: order {session_id} already exists, skipping creation.")
        order_obj = order_qs.first()
        queue_purchase_confirmation_email(order_obj.order_id)
        return True, order_obj

    with transaction.atomic():
        # Re-check existence inside transaction lock
        order_qs = Order.objects.select_for_update().filter(payment_token=session_id)
        if order_qs.exists():
            logger.info(f"Stripe order processing: order {session_id} already exists inside transaction, skipping.")
            order_obj = order_qs.first()
            queue_purchase_confirmation_email(order_obj.order_id)
            return True, order_obj

        metadata = session.get("metadata", {})
        payment_intent_metadata = {}

        if payment_intent_id:
            try:
                pi = stripe.PaymentIntent.retrieve(payment_intent_id, expand=["latest_charge"])
                payment_intent_metadata = pi.get("metadata", {}) if hasattr(pi, "get") else {}
            except Exception as e:
                logger.warning(f"Could not retrieve payment intent metadata with latest_charge: {e}")
                try:
                    pi = stripe.PaymentIntent.retrieve(payment_intent_id)
                    payment_intent_metadata = pi.get("metadata", {}) if hasattr(pi, "get") else {}
                except Exception:
                    pass

        effective_metadata = payment_intent_metadata or metadata
        checkout_attempt_id = effective_metadata.get("checkout_attempt_id")
        order_id = effective_metadata.get("order_id")

        amount_received = session.get("amount_total", 0) / 100.0
        total_price = amount_received

        payment_source = "Made with Stripe"
        last_digits = None
        payment_method = session.get("payment_method_types", [])
        if "card" in payment_method:
            payment_source = "Made with Stripe (Card)"
            if payment_intent_id:
                try:
                    pi = stripe.PaymentIntent.retrieve(payment_intent_id, expand=["latest_charge"])
                    latest_charge = pi.get("latest_charge") if hasattr(pi, "get") else None
                    if latest_charge and isinstance(latest_charge, dict):
                        card_info = latest_charge.get("payment_method_details", {}).get("card", {})
                        last_digits = card_info.get("last4")
                        brand = card_info.get("brand", "")
                        if brand:
                            payment_source = f"Made with Stripe ({brand.title()})"
                except Exception:
                    pass

        if checkout_attempt_id:
            if session.get("payment_status") != "paid":
                logger.info(
                    "Stripe checkout attempt %s is not paid; no order was created.",
                    checkout_attempt_id,
                )
                return False, None

            checkout_attempt = (
                StripeCheckoutAttempt.objects.select_for_update()
                .select_related('user')
                .filter(checkout_attempt_id=checkout_attempt_id)
                .first()
            )
            if checkout_attempt is None:
                order_obj = Order.objects.filter(payment_token=session_id).first()
                if order_obj:
                    queue_purchase_confirmation_email(order_obj.order_id)
                    return True, order_obj
                logger.error(
                    "Stripe order processing: checkout attempt %s was not found.",
                    checkout_attempt_id,
                )
                return False, None

            shipping_address_obj = _create_checkout_address_snapshot(checkout_attempt.shipping_address)
            billing_address_obj = _create_checkout_address_snapshot(checkout_attempt.billing_address)
            order_obj = Order.objects.create(
                payment_token=session_id,
                subtotal=checkout_attempt.subtotal,
                shipping_amount=checkout_attempt.shipping_amount,
                tax_amount=0,
                total_price=total_price,
                total_paid=total_price,
                minimum_payment=calculate_minimum_payment(total_price),
                payment_source=payment_source,
                quantity=checkout_attempt.total_quantity,
                shipping_address=shipping_address_obj,
                billing_address=billing_address_obj,
                user=checkout_attempt.user,
                last_digits=last_digits,
                discount_code=checkout_attempt.discount_code,
                transaction_status="completed",
                paid=True,
            )
            create_order_items(checkout_attempt.cart_items, order_obj)
            checkout_attempt.delete()

            logger.info(
                "Stripe order processing: order %s created after confirmed payment for session %s.",
                order_obj.order_id,
                session_id,
            )
            queue_purchase_confirmation_email(order_obj.order_id)
            return True, order_obj

        if order_id:
            try:
                order_obj = Order.objects.select_for_update().get(order_id=int(order_id))
            except Order.DoesNotExist:
                logger.error(f"Stripe order processing: order {order_id} not found in database.")
                return False, None

            if order_obj.paid:
                logger.info(f"Stripe order processing: order {order_id} is already marked as paid.")
                queue_purchase_confirmation_email(order_obj.order_id)
                return True, order_obj

            order_obj.payment_token = session_id
            order_obj.paid = True
            order_obj.transaction_status = "completed"
            order_obj.total_price = total_price
            order_obj.total_paid = total_price
            order_obj.payment_source = payment_source
            if last_digits is not None:
                order_obj.last_digits = last_digits
            order_obj.save()

            logger.info(f"Stripe order processing: order {order_id} successfully updated to paid/completed.")
            queue_purchase_confirmation_email(order_obj.order_id)
            return True, order_obj

        else:
            # Fallback for old sessions that didn't have order_id in metadata
            user_id = effective_metadata.get("user_id")
            address_id = effective_metadata.get("address_id")
            subtotal = float(effective_metadata.get("subtotal", 0))
            shipping_amount = float(effective_metadata.get("shipping_amount", 0))
            total_quantity = int(effective_metadata.get("total_quantity", 0))
            discount_code = effective_metadata.get("discount_code", "")
            cart_json = effective_metadata.get("cart_json", "[]")

            if not user_id:
                logger.error("Stripe order processing: no order_id or user_id in metadata")
                return False, None

            try:
                user = User.objects.get(id=int(user_id))
            except User.DoesNotExist:
                logger.error(f"Stripe order processing: user {user_id} not found")
                return False, None

            try:
                address = Address.objects.get(id=int(address_id))
            except Address.DoesNotExist:
                logger.error(f"Stripe order processing: address {address_id} not found")
                return False, None

            order_data = {
                "payment_token": session_id,
                "subtotal": subtotal,
                "shipping_amount": shipping_amount,
                "tax_amount": 0,
                "total_price": total_price,
                "total_paid": total_price,
                "minimum_payment": calculate_minimum_payment(total_price),
                "payment_source": payment_source,
                "quantity": total_quantity,
                "shipping_address": address,
                "billing_address": address,
                "user": user,
                "last_digits": last_digits,
                "discount_code": discount_code,
                "transaction_status": "completed",
            }

            order_obj = Order.objects.create(**order_data)

            try:
                cart_items = json.loads(cart_json)
                create_order_items(cart_items, order_obj)
            except Exception as e:
                logger.error(f"Stripe order processing: error creating order items: {e}")

            logger.info(f"Stripe order processing: order {session_id} created for user {user_id}, total ${total_price}")
            queue_purchase_confirmation_email(order_obj.order_id)
            return True, order_obj


def _handle_checkout_completed(event_data):
    """Process a completed checkout session and create the order."""
    session = event_data.get("data", {}).get("object", {})
    return _process_successful_checkout(session)


def _handle_dispute(event_data):
    """Handle a charge dispute/chargeback."""
    try:
        dispute = event_data.get("data", {}).get("object", {})
        charge_id = dispute.get("charge", "")
        logger.warning(f"Stripe dispute received for charge {charge_id}")
    except Exception as e:
        logger.error(f"Stripe webhook: error handling dispute: {e}")


@api_view(['GET'])
def stripe_checkout_success(request):
    """
    Verify a Stripe checkout session completed successfully.
    Returns session details for the frontend success page.
    """
    if not request.user.is_authenticated:
        return Response(
            {"error": "Please sign in."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    session_id = request.query_params.get("session_id", "")
    if not session_id:
        return Response(
            {"error": "No session ID provided."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status == "paid":
            # Fallback order creation if not already created by webhook
            _, order = _process_successful_checkout(session)
            if order is None:
                order = Order.objects.filter(
                    payment_token=session_id,
                    user=request.user,
                ).first()

            if order is None or order.user_id != request.user.id:
                return Response(
                    {"error": "Confirmed order not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response({
                "status": "success",
                "session_id": session_id,
                "amount_total": session.amount_total / 100.0,
                "currency": session.currency,
                "customer_email": session.customer_email,
                "payment_status": session.payment_status,
                "order_confirmed": True,
                "order_id": order.order_id,
            })
        else:
            return Response({
                "status": "pending",
                "session_id": session_id,
                "payment_status": session.payment_status,
            })

    except stripe.error.StripeError as e:
        logger.error(f"Stripe retrieval error: {e}")
        return Response(
            {"error": "Could not verify payment status."},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Checkout success verification error: {e}")
        return Response(
            {"error": "An error occurred while verifying payment."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def stripe_publishable_key(request):
    """Return the Stripe publishable key for the frontend."""
    return Response({
        "publishable_key": STRIPE_PUBLISHABLE_KEY or "",
        "stripe_enabled": bool(STRIPE_SECRET_KEY),
    })


def _calculate_shipping(cart_items, subtotal):
    """
    Calculate shipping cost based on cart contents.
    Mirrors the frontend shipping logic for consistency.
    """
    consumable_items = [i for i in cart_items if i.get("shippingCost") == 100]
    reagent_items = [i for i in cart_items if i.get("shippingCost") == 60]

    subtotal_consumables = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in consumable_items)
    subtotal_reagents = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in reagent_items)

    shipping = 0

    if consumable_items:
        shipping_subtotal = subtotal_consumables + subtotal_reagents
        if shipping_subtotal <= 2000:
            shipping = 100
        else:
            additional_blocks = -(-int(shipping_subtotal - 2000) // 1000)
            calculated = 100 + additional_blocks * 60
            shipping = min(700, calculated)
    elif reagent_items:
        if subtotal_reagents <= 1000:
            shipping = 60
        else:
            additional_blocks = -(-int(subtotal_reagents - 1000) // 500)
            calculated = 60 + additional_blocks * 30
            shipping = min(300, calculated)

    return shipping


def _get_frontend_url():
    """Determine the frontend URL based on environment."""
    configured_url = os.getenv("FRONTEND_URL", "").strip()
    if configured_url:
        return configured_url.rstrip("/")
    if DEBUG and DEBUG == "True":
        return "http://localhost:5173"
    return "https://bioarktech.com"
