from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import send_mail
from django.db import IntegrityError, connection, transaction
from django.db.models import Max

from .models import Quote


def build_quote_notification_message(quote, supplemental_fields=None):
    lines = [
        'New Quote Request from Bioark Tech',
        'Customer Information:',
        '-----------------------',
        f'Quote ID: {quote.id}',
        f'External ID: {quote.external_id}',
        f'Name: {quote.first_name} {quote.last_name}',
        f'Email: {quote.email}',
    ]

    fields = [
        ('Phone', quote.phone),
        ('Company/Institution', quote.company),
        ('Department', quote.department),
        ('Service Type', quote.service_type),
        ('Timeline', quote.timeline),
        ('Budget', quote.budget),
    ]
    fields.extend(supplemental_fields or [])
    lines.extend(f'{label}: {value}' for label, value in fields if value)

    if quote.project_description:
        lines.extend([
            '',
            'Project Description:',
            '-----------------------',
            quote.project_description,
        ])

    if quote.additional_info:
        lines.extend([
            '',
            'Additional Information:',
            '-----------------------',
            quote.additional_info,
        ])

    return '\n'.join(str(line) for line in lines) + '\n'


def send_quote_notification(quote, supplemental_fields=None):
    recipient = str(getattr(settings, 'EMAIL_NOTIFICATION_RECIPIENT', '') or '').strip()
    if not recipient:
        raise ImproperlyConfigured('EMAIL_NOTIFICATION_RECIPIENT must not be blank.')

    return send_mail(
        subject='New Quote from Bioark Tech',
        message=build_quote_notification_message(quote, supplemental_fields),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
    )


def create_quote_record(**fields):
    try:
        return Quote.objects.create(**fields)
    except IntegrityError as exc:
        exc_str = str(exc).lower()
        if 'id' not in exc_str and 'pkey' not in exc_str and 'duplicate' not in exc_str and 'unique' not in exc_str and 'null' not in exc_str:
            raise

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute('LOCK TABLE public."quote" IN EXCLUSIVE MODE')

        next_id = (Quote.objects.aggregate(max_id=Max('id'))['max_id'] or 0) + 1
        return Quote.objects.create(id=next_id, **fields)
