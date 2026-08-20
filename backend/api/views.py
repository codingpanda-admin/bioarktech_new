import json
import logging
import os

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.core.paginator import Paginator
from django.utils import timezone


from rest_framework.decorators import api_view
from rest_framework.response import Response


from products.serializers import ProductSerializer
from users.models import User
from api.models import EmailVerificationToken, PasswordResetToken
from quote.models import Quote
from quote.services import create_quote_record
from products.models import *

FRONTEND_DOMAIN = os.environ.get('FRONTEND_DOMAIN') or 'http://localhost:5173'
logger = logging.getLogger(__name__)


def generate_quote_external_id(request):
    if not request.session.session_key:
        request.session.create()

    timestamp = timezone.localtime(timezone.now()).strftime("%Y%m%d%M%S")
    return f"q_{request.session.session_key}_{timestamp}"

def get_csrf(request):
    response = JsonResponse({'detail': 'CSRF cookie set', 'csrftoken': get_token(request)})
    return response

@require_POST
def signup_view(request):
    data = json.loads(request.body)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')

    # Address fields
    address_line_1 = data.get('addressLine1', '')
    address_line_2 = data.get('addressLine2', '')
    apt_suite = data.get('aptSuite', '')
    city = data.get('city', '')
    state = data.get('state', '')
    zipcode = data.get('zipcode', '')
    country = data.get('country', 'US')

    # Basic validation
    if not email:
        return JsonResponse({'detail': 'All fields are required'}, status=400)
    
    # Validate email format
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': 'Invalid email address.'}, status=400)

    if password:
        has_required_characters = (
            len(password) >= 8
            and any(char.islower() for char in password)
            and any(char.isupper() for char in password)
            and any(char.isdigit() for char in password)
            and any(not char.isalnum() for char in password)
        )
        if not has_required_characters:
            return JsonResponse({
                'detail': 'Create a stronger password with at least 8 characters, including uppercase, lowercase, a number, and a special character.'
            }, status=400)

        password_user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        try:
            validate_password(password, user=password_user)
        except ValidationError as exc:
            return JsonResponse({'detail': ' '.join(exc.messages)}, status=400)
    
    # Create user
    try:
        # Check if a user with the given email already exists
        user = User.objects.filter(email=email).first()
        
        if user:
            # If the user exists and password is not provided, account has not been activated yet
            if not user.has_usable_password() and not password:
                return JsonResponse({'detail': 'The email you provided already exists in our system. Please verify your account has been activated.'}, status=400) 
            # If the user exists and password is provided, activate account
            elif not user.has_usable_password() and password:
                user.set_password(password)
                user.is_active = True
                user.save()
                return JsonResponse({'detail': 'Password successfully set.', 'success': True})
            else:
                return JsonResponse({'detail': 'An account already exists with this email. Try logging in.', 'success': False}, status=400)

        # create user account without password and send verification link
        elif not password:
            user = User(email=email)
            user.set_unusable_password()
            user.is_active = False
            user.save()
            send_verification_email(user)
            return JsonResponse({'detail': 'Verification email sent to activate account.'})

        else:
            # Create address if provided
            from users.models import Address
            shipping_address = None
            if address_line_1 or city or state or zipcode:
                shipping_address = Address.objects.create(
                    address_line_1=address_line_1,
                    address_line_2=address_line_2,
                    apt_suite=apt_suite,
                    city=city,
                    state=state,
                    zipcode=zipcode,
                    country=country
                )

            # Create a new user
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                shipping_address=shipping_address
            )
            user.save()
            return JsonResponse({'detail': 'Successfully signed up.', 'success': True})
    except Exception as e:
        return JsonResponse({'detail': 'An error has occurred when processing your email. Try again.', 'error': str(e)}, status=400)


@require_POST
def login_view(request):
    data = json.loads(request.body)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or password is None:
        return JsonResponse({'detail': 'Please provide email and password.'}, status=400)

    existing_user = User.objects.filter(email=email).only('is_active').first()
    if existing_user and not existing_user.is_active:
        return JsonResponse({'detail': 'This account has been deactivated.'}, status=403)

    user = authenticate(email=email, password=password)

    if user is None:
        return JsonResponse({'detail': 'Invalid credentials.'}, status=400)

    login(request, user)
    return JsonResponse({'detail': 'Successfully logged in.', 'success': True})


@require_POST
def logout_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'detail': 'You\'re not logged in.'}, status=400)

    logout(request)
    return JsonResponse({'detail': 'Successfully logged out.'})


@ensure_csrf_cookie
def session_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'isAuthenticated': False})

    return JsonResponse({'isAuthenticated': True})


def whoami_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'isAuthenticated': False})

    return JsonResponse({'username': request.user.username})


def send_verification_email(user):
    token, created = EmailVerificationToken.objects.get_or_create(user=user)
    verification_url = f"{FRONTEND_DOMAIN}/verify-email/{token.token}/"
    send_mail(
        subject="Verify your email address",
        message=f"Click the link below to verify your email address:\n{verification_url}",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
    )

@require_POST
def verify_email(request, token):
    verification_token = get_object_or_404(EmailVerificationToken, token=token)
    user = verification_token.user

    if verification_token.is_valid():
        verification_token.delete()

        if user.has_usable_password():
            # Activate account directly if password is already set
            user.is_active = True
            user.save()
            return JsonResponse({"status": "activated", "message": "Email verified successfully! You can now log in."})
        else:
            return JsonResponse({"status": "not_activated", "message": "Email verified successfully, redirecting to set password page.", "email": user.email})
    else:
        return JsonResponse({"status": "not_verified", "message": "Verification link expired or invalid."}, status=400)

@require_POST
def send_contact_form(request):
    data = json.loads(request.body)
    subject = data.get('subject')
    first_name = data.get('firstName', 'First Name')
    last_name = data.get('lastName', 'Last Name')
    email = data.get('email')
    phone = data.get('phone', 'Not specified')
    message = data.get('message')
    product = data.get('product', 'N/A')
    
    send_mail(
        subject=f"New message from Bioark Tech: {subject}",
        message=f"Customer: {last_name}, {first_name}\nEmail: {email}\nPhone: {phone}\n{message}\nProduct: {product}",
        html_message="<h1>New message from Bioark Tech</h1>",
        from_email="no-reply@bioarktech.com",
        recipient_list=["no-reply@bioarktech.com"],
    )

    return JsonResponse({"detail": "Contact form sent."})

@require_POST
def send_quote_form(request):
    data = json.loads(request.body)
    email = data.get('email')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    phone = data.get('phone')
    company = data.get('company') or data.get('institution')
    department = data.get('department')
    timeline = data.get('timeline')
    budget = data.get('budget')
    project_description = data.get('projectDescription') or data.get('project_description')
    additional_info = data.get('additionalInfo') or data.get('additionalInformation') or data.get('additional_info')
    gene_sequence = data.get('geneSequence')
    gene_species = data.get('geneSpecies')
    institution = data.get('institution')
    mammalian_cells = data.get('mammalianCells')
    plasmid_amount = data.get('plasmidAmount')
    product_type = data.get('productType')
    service_type = data.get('serviceType')
    cell_line_amount = data.get('cellLineAmount')
    message = data.get('message')
    user = request.user if request.user.is_authenticated else None

    if not first_name or not last_name or not email:
        return JsonResponse({'detail': 'First name, last name, and email are required.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': 'Invalid email address.'}, status=400)

    external_id = data.get('externalId') or data.get('external_id') or generate_quote_external_id(request)

    quote = create_quote_record(
        user=user,
        external_id=external_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        company=company,
        department=department,
        service_type=service_type or data.get('productType'),
        timeline=timeline,
        budget=budget,
        project_description=project_description or message,
        additional_info=additional_info,
        read=False,
    )
    
    template_type = data.get('templateType') or data.get('template_type')
    if not template_type:
        service_val = (quote.service_type or '').strip().lower()
        if service_val == 'products' or data.get('catalogNumber') or data.get('catalog_number'):
            template_type = 'product'
        else:
            template_type = 'full'

    email_context = {
        'firstName': quote.first_name,
        'lastName': quote.last_name,
        'email': quote.email,
        'phone': quote.phone or '',
        'company': quote.company or '',
        'department': quote.department or '',
        'serviceType': quote.service_type or '',
        'timeline': quote.timeline or '',
        'budget': quote.budget or '',
        'projectDescription': quote.project_description or '',
        'additionalInfo': quote.additional_info or '',
        'catalogNumber': data.get('catalogNumber') or data.get('catalog_number') or '',
        'createdAt': quote.created_at.strftime('%Y-%m-%d %H:%M:%S') if quote.created_at else '',
    }

    from quote.services import send_quote_smtp_email
    sent, err_msg = send_quote_smtp_email(email_context, template_type=template_type)

    if not sent:
        logger.warning("Quote %s was saved, but SMTP email notification failed: %s", quote.id, err_msg)
        return JsonResponse({
            "detail": "Quote request saved, but the notification email could not be sent.",
            "id": quote.id,
            "externalId": quote.external_id,
            "emailSent": False,
        }, status=201)

    return JsonResponse({"detail": "Quote request saved.", "id": quote.id, "externalId": quote.external_id, "emailSent": True}, status=201)


@require_POST
def resend_verification(request):
    data = json.loads(request.body)
    email = data.get('email')

    # Check if the email exists
    user = User.objects.filter(email=email).first()
    if not user:
        return JsonResponse({'detail': 'Email address not found.'}, status=404)

    # Check if the user is already verified
    if user.is_active and user.has_usable_password():
        return JsonResponse({'detail': 'Account already verified. Please log in.'}, status=400)

    send_verification_email(user)

    return JsonResponse({'detail': 'A new verification link has been sent to your email.'})

def classify_product(category_id, source_type):
    cat_id = (category_id or '').strip().lower()
    src_type = (source_type or '').strip().lower()
    
    if cat_id == 'category-1780539818236':
        return 'consumables'
    
    if cat_id in ['category-1765063995229', 'category-1766675380397', 'category-1766675365489', 'category-1765995504911'] or src_type == 'reagent':
        return 'reagents'
        
    return 'products'

def get_first_catalog_option_price(product, fallback=''):
    options = product.options if isinstance(product.options, list) else []
    option_prices = product.option_prices if isinstance(product.option_prices, dict) else {}

    if options:
        first_option = str(options[0] or '').strip()
        return option_prices.get(first_option) or fallback

    return next((price for price in option_prices.values() if price not in [None, '']), fallback)

def is_product_consumable(product):
    return product.category_external_id == 'category-1780539818236'

def is_featured_product_consumable(fp):
    # Featured products without wet ice in shipping info are consumables (cryotubes, pipettes, plates, boxes, etc.)
    linked_product = Product.objects.filter(catalog_number=fp.catalog_number, hidden=False).first()
    if linked_product:
        return linked_product.category_external_id == 'category-1780539818236'
    return 'wet ice' not in (fp.ship_info or "").lower()

@api_view(['GET'])
def search_product(request):
    query = request.query_params.get('q', '').strip()
    category_filter = request.query_params.get('category', '').strip().lower()
    page_size = int(request.query_params.get('page_size', 200)) # Large page size to show all products
    page_number = int(request.query_params.get('page_number', 1))

    # Helper mapping for query text to category filters
    if query.lower() in ['consumables', 'consumibles']:
        category_filter = 'consumables'
        query = ''
    elif query.lower() in ['reagents', 'reactivos', 'reagent kit', 'reagents & kits', 'reagents and kits']:
        category_filter = 'reagents'
        query = ''
    elif query.lower() in ['products', 'productos', 'custom products']:
        category_filter = 'products'
        query = ''
    elif query.lower() in ['services', 'servicios']:
        category_filter = 'services'
        query = ''

    list_keywords = query.split()

    if list_keywords:
        # Query Product table
        search_query = Q()
        for keyword in list_keywords:
            search_query |= Q(product_name__icontains=keyword)
            search_query |= Q(external_id__icontains=keyword)
            search_query |= Q(catalog_number__icontains=keyword)
            search_query |= Q(category_external_id__icontains=keyword)
            search_query |= Q(product_group__icontains=keyword)
            search_query |= Q(source_type__icontains=keyword)
            search_query |= Q(description__icontains=keyword)
            search_query |= Q(content_text__icontains=keyword)

        products = Product.objects.filter(search_query, hidden=False)

        # Query FeaturedProduct table
        featured_search_query = Q()
        for keyword in list_keywords:
            featured_search_query |= Q(product_name__icontains=keyword)
            featured_search_query |= Q(catalog_number__icontains=keyword)
            featured_search_query |= Q(description__icontains=keyword)

        featured_products = FeaturedProduct.objects.filter(featured_search_query)
    else:
        products = Product.objects.filter(hidden=False)
        featured_products = FeaturedProduct.objects.all()

    combined_results = []
    seen_skus = set()
    
    # 1. Add featured products first to prioritize rich featured data (prices/images)
    for fp in featured_products:
        linked_products = Product.objects.filter(catalog_number__iexact=fp.catalog_number)
        linked_product = linked_products.filter(hidden=False).first()

        # FeaturedProduct is legacy detail/pricing data, not an independently
        # active catalog item. Only an active canonical Product may appear in
        # public search, preventing deactivated or orphaned legacy rows from
        # restoring inactive categories and products.
        if not linked_product:
            continue

        sku = (fp.catalog_number or "").strip()
        if sku:
            seen_skus.add(sku.lower())

        linked_cat_id = linked_product.category_external_id if linked_product else None
        linked_src_type = linked_product.source_type if linked_product else 'reagent'
        linked_group = linked_product.product_group if linked_product else None

        category_type = classify_product(linked_cat_id, linked_src_type)
        
        # Apply category filter
        if category_filter == 'featured':
            # Featured products are always featured
            pass
        else:
            if category_filter == 'consumables' and category_type != 'consumables':
                continue
            if category_filter == 'reagents' and category_type not in ['reagents', 'consumables']:
                continue
            if category_filter == 'products' and category_type != 'products':
                continue
            if category_filter == 'services':
                continue

        prod_cat = 'Consumables' if category_type == 'consumables' else ('Reagents & Kits' if category_type == 'reagents' else 'Products & Services')

        up = UnitPrice.objects.filter(union=fp.union).first()
        price = float(up.unit_price) if up else 0.0
        
        img = Image.objects.filter(union=fp.union).first()
        if img and img.image:
            import os
            from django.conf import settings
            filename = os.path.basename(img.image.name)
            subfolder_path = os.path.join(settings.MEDIA_ROOT, 'product_images', filename)
            if os.path.exists(subfolder_path):
                img_url = f"/media/product_images/{filename}"
            else:
                img_url = f"/media/{filename}"
        else:
            img_url = None
        
        combined_results.append({
            'product_id': fp.id,
            'product_sku': fp.catalog_number,
            'external_id': linked_product.external_id if linked_product else None,
            'externalId': linked_product.external_id if linked_product else None,
            'product_name': fp.product_name,
            'description': fp.description,
            'unit_price': price,
            'list_price': linked_product.list_price or '',
            'options': linked_product.options or [],
            'option_prices': linked_product.option_prices or {},
            'first_option_price': get_first_catalog_option_price(linked_product, price),
            'image': img_url,
            'category': prod_cat,
            'category_external_id': linked_cat_id,
            'product_group': linked_group,
            'shipping_cost': 100.0 if category_type == 'consumables' else 60.0,
            'is_featured': True
        })
        
    # 2. Add general products next, skipping any that were already added as featured
    for p in products:
        sku = (p.catalog_number or p.external_id or "").strip()
        if sku and sku.lower() in seen_skus:
            continue
        if sku:
            seen_skus.add(sku.lower())
            
        category_type = classify_product(p.category_external_id, p.source_type)
        
        # Apply category filter
        if category_filter == 'featured':
            if not (p.is_featured or p.show_in_featured):
                continue
        else:
            if category_filter == 'consumables' and category_type != 'consumables':
                continue
            if category_filter == 'reagents' and category_type not in ['reagents', 'consumables']:
                continue
            if category_filter == 'products' and category_type != 'products':
                continue
            if category_filter == 'services':
                continue

        prod_cat = 'Consumables' if category_type == 'consumables' else ('Reagents & Kits' if category_type == 'reagents' else 'Products & Services')

        combined_results.append({
            'product_id': p.product_id,
            'product_sku': p.catalog_number or p.external_id,
            'external_id': p.external_id,
            'externalId': p.external_id,
            'catalog_number': p.catalog_number,
            'product_name': p.product_name,
            'description': p.description,
            'unit_price': 0.0,
            'list_price': p.list_price or '',
            'options': p.options or [],
            'option_prices': p.option_prices or {},
            'first_option_price': get_first_catalog_option_price(p),
            'image': p.image_url or (p.images[0] if p.images else None),
            'category': prod_cat,
            'category_external_id': p.category_external_id,
            'product_group': p.product_group,
            'shipping_cost': 100.0 if category_type == 'consumables' else 60.0,
            'is_featured': p.is_featured or p.show_in_featured
        })


    # 3. Add services from ServiceMode
    if category_filter not in ['reagents', 'consumables'] and category_filter != 'products':
        from interface.models import ServiceMode
        service_filters = {'hidden': False}
        if category_filter == 'featured':
            service_filters['is_featured'] = True

        if list_keywords:
            service_query = Q()
            for keyword in list_keywords:
                service_query |= Q(title__icontains=keyword)
                service_query |= Q(url__icontains=keyword)
                service_query |= Q(content__icontains=keyword)
                service_query |= Q(category__icontains=keyword)
                service_query |= Q(service_group__icontains=keyword)
            services = ServiceMode.objects.filter(service_query, **service_filters)
        else:
            services = ServiceMode.objects.filter(**service_filters)

        for s in services:
            # Clean HTML content for description snippet
            import re
            clean_desc = re.sub(r'<[^>]*>', '', s.content)[:180] + "..." if s.content else ""
            
            # Map category to service category external ID
            svc_cat = s.category or 'services'
            if svc_cat == 'genome-editing':
                svc_cat = 'genome-editing-services'
            elif svc_cat == 'synthesis-cloning':
                svc_cat = 'synthesis-cloning-services'
            elif svc_cat == 'virus-packaging':
                svc_cat = 'virus-packaging-services'
            elif svc_cat == 'vector-construction':
                svc_cat = 'vector-construction-services'
            elif svc_cat == 'functional-testing':
                svc_cat = 'functional-testing-services'

            combined_results.append({
                'product_id': f"svc-{s.id}",
                'product_sku': s.url.upper(),
                'external_id': s.url,
                'externalId': s.url,
                'catalog_number': s.url.upper(),
                'product_name': s.title,
                'description': clean_desc,
                'unit_price': 0.0,
                'list_price': 'Contact for Quote',
                'image': f"/media/{s.image.name}" if s.image else None,
                'category': 'Services',
                'category_external_id': svc_cat,
                'product_group': s.service_group or None,
                'shipping_cost': 0.0,
                'is_featured': s.is_featured
            })

    # Sort all results alphabetically by name
    combined_results.sort(key=lambda x: x['product_name'].lower())

    paginator = Paginator(combined_results, page_size)

    page_obj = paginator.get_page(page_number)

    data = {
        "length": len(combined_results),
        "results": list(page_obj),
        "products": list(page_obj)
    }

    return Response(data)


@require_POST
def request_password_reset(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        if not email:
            return JsonResponse({'detail': 'Email is required.'}, status=400)

        user = User.objects.filter(email=email).first()
        if user:
            # Delete any existing reset tokens for this user
            PasswordResetToken.objects.filter(user=user).delete()
            # Create a new token
            token_obj = PasswordResetToken.objects.create(user=user)
            
            # Send reset email
            reset_url = f"{FRONTEND_DOMAIN}/reset-password/{token_obj.token}/"
            email_body = (
                f"Hello {user.first_name or 'user'},\n\n"
                f"We received a request to reset your password for your Bioark Tech account.\n"
                f"Click the link below to reset your password (this link expires in 2 hours):\n"
                f"{reset_url}\n\n"
                f"If you did not request this change, please ignore this email.\n\n"
                f"Best regards,\n"
                f"The Bioark Tech Team"
            )
            
            try:
                send_mail(
                    subject="Reset your password - Bioark Tech",
                    message=email_body,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user.email],
                    fail_silently=False
                )
            except Exception as e:
                logger.error(f"Failed to send password reset email: {e}")
                
        return JsonResponse({'detail': 'If your email is registered, you will receive a password reset link shortly.', 'success': True})
    except Exception as e:
        return JsonResponse({'detail': f'An unexpected error occurred: {str(e)}'}, status=500)


@require_POST
def confirm_password_reset(request, token):
    try:
        data = json.loads(request.body)
        new_password = data.get('password')
        confirm_password = data.get('confirmPassword')
        
        if not new_password or not confirm_password:
            return JsonResponse({'detail': 'New password and confirmation are required.'}, status=400)
            
        if new_password != confirm_password:
            return JsonResponse({'detail': 'Passwords do not match.'}, status=400)
            
        token_obj = PasswordResetToken.objects.filter(token=token).first()
        if not token_obj or not token_obj.is_valid():
            return JsonResponse({'detail': 'The password reset link is invalid or has expired.'}, status=400)
            
        user = token_obj.user
        user.set_password(new_password)
        user.save()
        
        # Delete token after use
        token_obj.delete()
        
        return JsonResponse({'detail': 'Your password has been reset successfully. You can now sign in.', 'success': True})
    except Exception as e:
        return JsonResponse({'detail': f'An unexpected error occurred: {str(e)}'}, status=500)


@require_POST
def google_login(request):
    try:
        data = json.loads(request.body)
        credential = data.get('credential')
        if not credential:
            return JsonResponse({'detail': 'No credential provided.'}, status=400)
            
        # Verify the token using Google tokeninfo endpoint
        import requests
        response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}")
        if response.status_code != 200:
            return JsonResponse({'detail': 'Invalid Google credential token.'}, status=400)
            
        token_info = response.json()
        
        email = token_info.get('email')
        email_verified = token_info.get('email_verified')
        first_name = token_info.get('given_name', '')
        last_name = token_info.get('family_name', '')
        picture = token_info.get('picture', '')
        
        if not email or (email_verified != 'true' and email_verified != True):
            return JsonResponse({'detail': 'Google email is not verified or unavailable.'}, status=400)
            
        email = email.lower()
        
        # Check if user already exists
        user = User.objects.filter(email=email).first()

        if user:
            if not user.is_active:
                return JsonResponse({'detail': 'This account has been deactivated.'}, status=403)

            # Connect accounts seamlessly since email is verified by Google
            if not user.profile_picture and picture:
                try:
                    from django.core.files.base import ContentFile
                    img_response = requests.get(picture, timeout=5)
                    if img_response.status_code == 200:
                        user.profile_picture.save(f"google_{user.id}.jpg", ContentFile(img_response.content), save=True)
                except Exception as img_err:
                    logger.error(f"Failed to save Google profile picture: {img_err}")
            
        else:
            # Create new user
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            user.set_unusable_password()
            
            if picture:
                try:
                    from django.core.files.base import ContentFile
                    img_response = requests.get(picture, timeout=5)
                    if img_response.status_code == 200:
                        user.profile_picture.save(f"google_{user.id}.jpg", ContentFile(img_response.content), save=True)
                except Exception as img_err:
                    logger.error(f"Failed to save Google profile picture for new user: {img_err}")
                    
            user.save()

        # Log the user in
        login(request, user)
        return JsonResponse({'detail': 'Successfully logged in with Google.', 'success': True, 'email': email})
        
    except Exception as e:
        return JsonResponse({'detail': f'An unexpected error occurred: {str(e)}'}, status=500)
