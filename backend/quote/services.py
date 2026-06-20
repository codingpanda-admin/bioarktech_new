from django.db import IntegrityError, connection, transaction
from django.db.models import Max

from .models import Quote


def create_quote_record(**fields):
    try:
        return Quote.objects.create(**fields)
    except IntegrityError as exc:
        if 'null value in column "id"' not in str(exc):
            raise

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute('LOCK TABLE public."quote" IN EXCLUSIVE MODE')

        next_id = (Quote.objects.aggregate(max_id=Max('id'))['max_id'] or 0) + 1
        return Quote.objects.create(id=next_id, **fields)
