from django.shortcuts import render
from rest_framework.decorators import api_view, authentication_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import check_password
import json
from django.core.paginator import Paginator

from orders.models import *
from orders.serializers import *
from users.serializers import UserSerializer


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
def example_view(request):
    content = {
        'user': str(request.user),  # `django.contrib.auth.User` instance.
        'auth': str(request.auth),  # None
    }
    return Response(content)

@api_view(['GET'])
def view_order(request, payment_token):
    order = Order.objects.get(payment_token=payment_token)
    serializer = OrderSerializer(order)
    
    return Response(serializer.data)

@api_view(['GET'])
def view_orders(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    page_number = request.query_params.get('page_number', 1)
    page_size = request.query_params.get('page_size', 5)
    order_class = request.query_params.get('order_class', None)
    status = request.query_params.get('status', None)

    orders = Order.objects.filter(user=request.user)
    order_items = OrderItem.objects.filter(order__in=orders).order_by('-order_placed_date')

    # filter order items by order class
    if order_class:
        order_items = order_items.filter(order_class=order_class)
    
    # view open orders
    if status == 'open':
        order_items = order_items.filter(status=status)
    # view orders in process -> status is in_progress OR ready_for_delivery
    elif status == 'in_progress':
        order_items = order_items.filter(status__in=['in_progress', 'ready_for_delivery'])
    # view completed orders -> status is invoiced OR paid
    elif status == 'completed':
        order_items = order_items.filter(status__in=['invoiced', 'paid'])

    paginator = Paginator(order_items, page_size)
    page_obj = paginator.get_page(page_number)

    serializer = OrderItemSerializer(page_obj, many=True)

    data = {
        'total': order_items.count(),
        'order_items': serializer.data
    }

    return Response(data)


@api_view(['GET'])
def view_user_info(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    user = User.objects.get(id=request.user.id)
    serializer = UserSerializer(user)

    return Response(serializer.data)


@api_view(['GET'])
def list_admin_users(request):
    users = User.objects.filter(is_admin=True).order_by('email')
    serializer = UserSerializer(users, many=True)

    return Response({"users": serializer.data})


@api_view(['GET'])
def list_customer_users(request):
    users = User.objects.filter(is_admin=False).order_by('email')
    serializer = UserSerializer(users, many=True)

    return Response({"users": serializer.data})

@api_view(['POST'])
def update_user_info(request):
    try:
        if not request.user.is_authenticated:
            return Response({'detail': 'User is not authenticated.'}, status=401)

        user = User.objects.get(id=request.user.id)
        data = request.data
        
        user.first_name = data.get('firstName', data.get('first_name', user.first_name))
        user.last_name = data.get('lastName', data.get('last_name', user.last_name))
        user.title = data.get('title', user.title)
        user.company = data.get('company', data.get('institution', user.company))
        user.job_title = data.get('jobTitle', data.get('job_title', user.job_title))
        user.mobile = data.get('mobile', user.mobile)
        user.telephone = data.get('telephone', user.telephone)

        if user.shipping_address == None:
            user.shipping_address = Address.objects.create(
                address_line_1='',
                city='',
                state='',
                country='US',
                zipcode='',
            )

        user.shipping_address.address_line_1 = data.get('addressLine1', data.get('address', user.shipping_address.address_line_1 or ''))
        user.shipping_address.address_line_2 = data.get('addressLine2', user.shipping_address.address_line_2)
        user.shipping_address.apt_suite = data.get('aptSuite', data.get('apt', user.shipping_address.apt_suite))
        user.shipping_address.city = data.get('city', user.shipping_address.city or '')
        user.shipping_address.state = data.get('state', user.shipping_address.state or '')
        user.shipping_address.country = data.get('country', user.shipping_address.country or 'US')
        user.shipping_address.zipcode = data.get('zipcode', user.shipping_address.zipcode or '')

        user.shipping_address.save()
        user.save()

        serializer = UserSerializer(user)
        return Response({"success": True, "user": serializer.data})

        
    except ObjectDoesNotExist:
            # Handle the case where the user ID does not exist
            return Response(
                {"detail": "User does not exist"},
                status=404
            )

@api_view(['GET'])
def get_user_email(request):
    # Check for authenticated user
    user = request.user
    if not user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    return Response({'email': user.email, 'detail': 'User email retrieved.'})

@api_view(['POST'])
def reset_user_email(request):
    data = request.data
    email = data.get('email')

    # Check for authenticated user
    user = request.user
    if not user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    # Check if email address is valid
    try:
        validate_email(email)
    except ValidationError:
        return Response({'detail': 'Invalid email address.'}, status=400)

    # Check if the email already exists in the system
    user = User.objects.filter(email=email).first()
    if user:
        return Response({'detail': 'Email is already taken.'}, status=400)
    
    # Update email info
    try:
        user = User.objects.get(id=request.user.id)
        user.email = email
        user.save()
        return Response({'detail': 'Email updated successfully!'})
    except:
        return Response({'detail': 'An error occurred when updating user email. Try again.'}, status=500)


@api_view(['POST'])
def reset_user_password(request):
    # Extract fields from request body
    data = request.data
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')

    # Validate all fields are provided
    if not all([current_password, new_password, confirm_password]):
        return Response({'detail': 'All fields are required.'}, status=400)

    # Get the currently authenticated user
    user = request.user
    if not user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    # Check if the current password matches the user's existing password
    if not check_password(current_password, user.password):
        return Response({'detail': 'Current password is incorrect.'}, status=400)

    # Check if the new password and confirm password match
    if new_password != confirm_password:
        return Response({'detail': 'New password and confirm password do not match.'}, status=400)

    # Ensure the new password is not the same as the current password
    if current_password == new_password:
        return Response({'detail': 'New password cannot be the same as the current password.'}, status=400)

    # Update the user's password
    try:
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password reset successfully.'}, status=200)
    except Exception as e:
        return Response({'detail': 'An unexpected error occurred. Try again.'}, status=500)


@api_view(['POST'])
def upload_profile_picture(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    user = User.objects.get(id=request.user.id)
    file = request.FILES.get('profile_picture')
    if not file:
        return Response({'detail': 'No file uploaded.'}, status=400)

    user.profile_picture = file
    user.save()

    serializer = UserSerializer(user)
    return Response({'success': True, 'user': serializer.data})
