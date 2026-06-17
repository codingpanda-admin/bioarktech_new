from datetime import datetime, date, timedelta
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import os
from dotenv import load_dotenv
import logging
import json
import secrets

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

from .models import *
from users.models import Address
from .serializers import *

import requests

load_dotenv()

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_API_BASE = "https://api-m.paypal.com"
DEBUG = os.getenv("DEBUG_FLAG")

if DEBUG == "True":
    PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID_DEV")
    PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET_DEV")
    PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com"


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
            unit_price = item['price']
            item = {key: value for key, value in item.items() if key in model_fields}
            OrderItem.objects.create(unit_price=unit_price,
                                    order_class=get_order_class(item['product_sku']),
                                    total_price=float(unit_price) * item['quantity'],
                                    order=order_obj,
                                    work_period=get_work_period(item['product_sku'], item['ready_status']),
                                    est_delivery_date=get_est_delivery_date(item['product_sku'], item['ready_status']),
                                    **item)

    except WorkSchedule.DoesNotExist or Exception:
        for item in cart:
            unit_price = item['price']
            item = {key: value for key, value in item.items() if key in model_fields}
            OrderItem.objects.create(unit_price=unit_price,
                                    order_class=get_order_class(item['product_sku']),
                                    total_price=float(unit_price) * item['quantity'],
                                    order=order_obj,
                                    **item)


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
