from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Quote
from .serializers import QuoteSerializer
from .services import create_quote_record


def generate_quote_external_id(request):
    if not request.session.session_key:
        request.session.create()

    timestamp = timezone.localtime(timezone.now()).strftime("%Y%m%d%M%S")
    return f"q_{request.session.session_key}_{timestamp}"


def require_admin(request):
    if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
        return Response({'detail': 'Admin access required.'}, status=403)

    return None


@api_view(['GET'])
def list_my_quotes(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'User is not authenticated.'}, status=401)

    quotes = Quote.objects.filter(user=request.user).order_by('read', '-created_at')
    serializer = QuoteSerializer(quotes, many=True)
    return Response({'results': serializer.data})


@api_view(['GET'])
def list_quotes(request):
    error = require_admin(request)
    if error:
        return error

    quotes = Quote.objects.all().order_by('-created_at')
    serializer = QuoteSerializer(quotes, many=True)
    return Response({'results': serializer.data})


@api_view(['GET'])
def get_quote(request, quote_id):
    error = require_admin(request)
    if error:
        return error

    quote = Quote.objects.get(id=quote_id)
    serializer = QuoteSerializer(quote)
    return Response(serializer.data)


@api_view(['POST'])
def create_quote(request):
    data = request.data
    first_name = data.get('firstName') or data.get('first_name')
    last_name = data.get('lastName') or data.get('last_name')
    email = data.get('email')
    user = request.user if request.user.is_authenticated else None

    if not first_name or not last_name or not email:
        return JsonResponse({'detail': 'First name, last name, and email are required.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': 'Invalid email address.'}, status=400)

    quote = create_quote_record(
        user=user,
        external_id=data.get('externalId') or data.get('external_id') or generate_quote_external_id(request),
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=data.get('phone'),
        company=data.get('company') or data.get('institution'),
        department=data.get('department'),
        service_type=data.get('serviceType') or data.get('service_type') or data.get('productType'),
        timeline=data.get('timeline'),
        budget=data.get('budget'),
        project_description=data.get('projectDescription') or data.get('project_description') or data.get('message'),
        additional_info=data.get('additionalInfo') or data.get('additionalInformation') or data.get('additional_info'),
        read=False,
    )

    # Determine template type (product vs full)
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

    from .services import send_quote_smtp_email
    send_quote_smtp_email(email_context, template_type=template_type)

    return JsonResponse({'detail': 'Quote request saved.', 'id': quote.id, 'externalId': quote.external_id}, status=201)

