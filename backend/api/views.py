import json
import logging
import os

from django.contrib.auth import authenticate, login, logout
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
from api.models import EmailVerificationToken, Quote
from products.models import *

FRONTEND_DOMAIN = os.environ.get('FRONTEND_DOMAIN')
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
    email = data.get('email').lower()
    password = data.get('password')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')

    # Basic validation
    if not email:
        return JsonResponse({'detail': 'All fields are required'}, status=400)
    
    # Validate email format
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': 'Invalid email address.'}, status=400)
    
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
            # Create a new user
            user = User.objects.create_user(email=email, password=password, first_name=first_name, last_name=last_name)
            user.save()
            return JsonResponse({'detail': 'Successfully signed up.', 'success': True})
    except Exception as e:
        return JsonResponse({'detail': 'An error has occurred when processing your email. Try again.', 'error': e}, status=400)


@require_POST
def login_view(request):
    data = json.loads(request.body)
    email = data.get('email').lower()
    password = data.get('password')

    if email is None or password is None:
        return JsonResponse({'detail': 'Please provide email and password.'}, status=400)

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

    if not first_name or not last_name or not email:
        return JsonResponse({'detail': 'First name, last name, and email are required.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': 'Invalid email address.'}, status=400)

    external_id = data.get('externalId') or data.get('external_id') or generate_quote_external_id(request)

    quote = Quote.objects.create(
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
    
    email_message = ("New Quote Request from Bioark Tech\n"
                     "Customer Information:\n"
                     "-----------------------\n"
                     f"Quote ID: {quote.id}\n"
                     f"External ID: {quote.external_id}\n"
                     f"Name: {first_name} {last_name}\n"
                     f"Email: {email}\n")

    def add_field(label, value):
        return f"{label}: {value}\n" if value else ""

    email_message += add_field("Phone", phone)
    email_message += add_field("Company/Institution", company or institution)
    email_message += add_field("Department", department)
    email_message += add_field("Gene Sequence", gene_sequence)
    email_message += add_field("Gene Species", gene_species)
    email_message += add_field("Institution", institution if institution != company else None)
    email_message += add_field("Mammalian Cells", mammalian_cells)
    email_message += add_field("Plasmid Amount", plasmid_amount)
    email_message += add_field("Product Type", product_type)
    email_message += add_field("Service Type", service_type)
    email_message += add_field("Cell Line Amount", cell_line_amount)
    email_message += add_field("Timeline", timeline)
    email_message += add_field("Budget", budget)

    if project_description:
        email_message += f"\nProject Description:\n-----------------------\n{project_description}\n"

    if additional_info:
        email_message += f"\nAdditional Information:\n-----------------------\n{additional_info}\n"

    if message:
        email_message += f"\nCustomer Message:\n-----------------------\n{message}\n"

    try:
        send_mail(
            subject="New Quote from Bioark Tech",
            message=email_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],
        )
    except Exception:
        logger.exception("Quote %s was saved, but the notification email failed.", quote.id)
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

def is_product_consumable(product):
    name = product.product_name.lower()
    external_id = product.external_id.lower()
    catalog_number = (product.catalog_number or "").lower()
    product_group = (product.product_group or "").lower()
    desc = (product.description or "").lower()
    
    # Consumables match keywords: system, device, cell line, cell type, cloning, vector
    consumable_keywords = ['system', 'device', 'cell line', 'cell type', 'cloning', 'vector']
    if any(kw in name or kw in external_id or kw in catalog_number or kw in product_group or kw in desc for kw in consumable_keywords):
        return True
    return False

def is_featured_product_consumable(fp):
    # Featured products without wet ice in shipping info are consumables (cryotubes, pipettes, plates, boxes, etc.)
    ship_info = (fp.ship_info or "").lower()
    return 'wet ice' not in ship_info

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
    
    # 1. Add general products
    for p in products:
        is_consumable = is_product_consumable(p)
        prod_cat = 'Consumables' if is_consumable else 'Reagents & Kits'
        
        # Apply category filter
        if category_filter == 'consumables' and not is_consumable:
            continue
        if category_filter == 'reagents' and is_consumable:
            continue

        combined_results.append({
            'product_id': p.product_id,
            'product_sku': p.catalog_number or p.external_id,
            'external_id': p.external_id,
            'externalId': p.external_id,
            'catalog_number': p.catalog_number,
            'product_name': p.product_name,
            'description': p.description,
            'unit_price': 0.0,
            'list_price': p.list_price or p.price_range or '',
            'image': p.image_url or (p.images[0] if p.images else None),
            'category': prod_cat,
            'shipping_cost': 100.0 if is_consumable else 40.0
        })
        
    # 2. Add featured products (including the imported reagents)
    for fp in featured_products:
        is_consumable = is_featured_product_consumable(fp)
        prod_cat = 'Consumables' if is_consumable else 'Reagents & Kits'
        
        # Apply category filter
        if category_filter == 'consumables' and not is_consumable:
            continue
        if category_filter == 'reagents' and is_consumable:
            continue

        up = UnitPrice.objects.filter(union=fp.union).first()
        price = float(up.unit_price) if up else 0.0
        list_p = float(up.list_price) if up else 0.0
        
        img = Image.objects.filter(union=fp.union).first()
        img_url = img.image.url if img and img.image else None
        linked_product = Product.objects.filter(catalog_number=fp.catalog_number, hidden=False).first()
        
        combined_results.append({
            'product_id': fp.id,
            'product_sku': fp.catalog_number,
            'external_id': linked_product.external_id if linked_product else None,
            'externalId': linked_product.external_id if linked_product else None,
            'product_name': fp.product_name,
            'description': fp.description,
            'unit_price': price,
            'list_price': list_p,
            'image': img_url,
            'category': prod_cat,
            'shipping_cost': 100.0 if is_consumable else 40.0
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
