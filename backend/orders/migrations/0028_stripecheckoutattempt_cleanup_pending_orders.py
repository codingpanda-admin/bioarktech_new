import uuid

import django.db.models.deletion
from django.db import migrations, models


def remove_abandoned_stripe_orders(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    OrderItem = apps.get_model('orders', 'OrderItem')

    abandoned_orders = Order.objects.filter(
        payment_source='Pending Payment (Stripe)',
        payment_token__startswith='pending-',
        transaction_status='pending',
        paid=False,
    )
    abandoned_order_ids = list(abandoned_orders.values_list('order_id', flat=True))
    if abandoned_order_ids:
        OrderItem.objects.filter(order_id__in=abandoned_order_ids).delete()
        abandoned_orders.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0027_order_purchase_confirmation_email'),
    ]

    operations = [
        migrations.CreateModel(
            name='StripeCheckoutAttempt',
            fields=[
                ('checkout_attempt_id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('cart_items', models.JSONField(default=list)),
                ('shipping_address', models.JSONField(default=dict)),
                ('billing_address', models.JSONField(default=dict)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=8)),
                ('shipping_amount', models.DecimalField(decimal_places=2, max_digits=8)),
                ('total_quantity', models.PositiveIntegerField(default=0)),
                ('discount_code', models.CharField(blank=True, default='', max_length=255)),
                ('stripe_session_id', models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stripe_checkout_attempts', to='users.user')),
            ],
            options={
                'db_table': 'stripe_checkout_attempt',
            },
        ),
        migrations.RunPython(remove_abandoned_stripe_orders, migrations.RunPython.noop),
    ]
