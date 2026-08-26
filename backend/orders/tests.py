import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.urls import reverse
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

from products.models import FeaturedProduct, Product
from users.models import Address, User

from .models import Order, OrderItem, StripeCheckoutAttempt
from .purchase_email import send_purchase_confirmation_email
from .views import _lookup_db_price, _process_successful_checkout


class CatalogPriceLookupTests(TestCase):
    def test_product_json_option_price_is_used_for_checkout(self):
        Product.objects.create(
            external_id='checkout-option-product',
            catalog_number='OPTION-001',
            product_name='Checkout Option Product',
            option_prices={'100 Rxn': '$46', '500 Rxn': '$198'},
            option_discounted_prices={},
            hidden=False,
        )
        FeaturedProduct.objects.create(
            catalog_number='OPTION-001',
            product_name='Checkout Option Product',
            description='',
            key_features='',
            performance_data='',
            storage_info='',
            ship_info='',
            shelf_status=True,
            on_display=True,
            units_in_stock=1,
            units='kit',
        )

        self.assertEqual(_lookup_db_price('OPTION-001', '500 rxn'), 198.0)

    def test_valid_json_option_discount_is_used_for_checkout(self):
        Product.objects.create(
            external_id='checkout-discount-product',
            catalog_number='OPTION-002',
            product_name='Checkout Discount Product',
            option_prices={'1 kit': '$200'},
            option_discounted_prices={'1 kit': '$150'},
            hidden=False,
        )

        self.assertEqual(_lookup_db_price('OPTION-002', '1 KIT'), 150.0)


class OrderInvoicePdfTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='invoice.customer@example.com',
            password='test-password',
            first_name='Avery',
            last_name='Researcher',
            company='Example Bio Lab',
            telephone='240-555-0100',
        )
        self.other_user = User.objects.create_user(
            email='other.customer@example.com',
            password='test-password',
        )
        self.address = Address.objects.create(
            address_line_1='100 Research Way',
            city='Rockville',
            state='MD',
            country='US',
            zipcode='20850',
        )
        self.order = Order.objects.create(
            payment_token='invoice-test-payment',
            subtotal=Decimal('180.00'),
            shipping_amount=Decimal('40.00'),
            tax_amount=Decimal('0.00'),
            total_price=Decimal('220.00'),
            total_paid=Decimal('220.00'),
            minimum_payment=Decimal('0.00'),
            payment_source='Made with Stripe (Visa)',
            quantity=2,
            shipping_address=self.address,
            billing_address=self.address,
            user=self.user,
            transaction_status='completed',
            paid=True,
        )
        OrderItem.objects.create(
            order=self.order,
            order_class='Reagents',
            product_sku='TEST-001',
            product_name='Example Research Reagent',
            unit_size='1 kit',
            unit_price=Decimal('90.00'),
            total_price=Decimal('180.00'),
            quantity=2,
            paid=True,
        )

    def test_owner_can_download_pdf_invoice(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse('order_invoice_pdf', args=[self.order.order_id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('BioArk-Invoice-IV', response['Content-Disposition'])
        self.assertEqual(response.content[:4], b'%PDF')
        self.assertGreater(len(response.content), 1000)

    def test_owner_can_view_pdf_invoice_inline(self):
        self.client.force_authenticate(self.user)
        url = f"{reverse('order_invoice_pdf', args=[self.order.order_id])}?view=1"

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response['Content-Disposition'].startswith('inline;'))

    @patch('orders.views.stripe.checkout.Session.retrieve')
    def test_checkout_success_returns_order_id_for_invoice_link(self, retrieve_session):
        self.client.force_authenticate(self.user)
        session_payload = {
            'id': self.order.payment_token,
            'payment_intent': '',
        }
        session = Mock()
        session.payment_status = 'paid'
        session.amount_total = 22000
        session.currency = 'usd'
        session.customer_email = self.user.email
        session.get.side_effect = session_payload.get
        retrieve_session.return_value = session

        response = self.client.get(
            reverse('stripe_checkout_success'),
            {'session_id': self.order.payment_token},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['order_id'], self.order.order_id)

    def test_anonymous_user_cannot_download_invoice(self):
        response = self.client.get(reverse('order_invoice_pdf', args=[self.order.order_id]))
        self.assertEqual(response.status_code, 401)

    def test_user_cannot_download_another_users_invoice(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.get(reverse('order_invoice_pdf', args=[self.order.order_id]))
        self.assertEqual(response.status_code, 404)

    def test_owner_can_view_html_invoice_with_print_action(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse('order_invoice_html', args=[self.order.order_id]))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response['Content-Type'].startswith('text/html'))
        self.assertTrue(response['Content-Disposition'].startswith('inline;'))
        self.assertContains(response, 'Example Research Reagent')
        self.assertContains(response, 'Print Invoice')
        self.assertNotContains(response, 'Download HTML')
        self.assertContains(response, 'BioArk-Invoice-IV')

    def test_owner_can_download_html_invoice(self):
        self.client.force_authenticate(self.user)
        url = f"{reverse('order_invoice_html', args=[self.order.order_id])}?download=1"

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response['Content-Disposition'].startswith('attachment;'))
        self.assertIn('.html', response['Content-Disposition'])

    def test_anonymous_user_cannot_view_html_invoice(self):
        response = self.client.get(reverse('order_invoice_html', args=[self.order.order_id]))
        self.assertEqual(response.status_code, 401)

    def test_user_cannot_view_another_users_html_invoice(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.get(reverse('order_invoice_html', args=[self.order.order_id]))
        self.assertEqual(response.status_code, 404)


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='orders@example.com',
    EMAIL_NOTIFICATION_RECIPIENT='notifications@example.com',
)
class PurchaseConfirmationEmailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='purchase.customer@example.com',
            password='test-password',
            first_name='Morgan',
            last_name='Scientist',
        )
        self.address = Address.objects.create(
            address_line_1='13 Taft Court',
            city='Rockville',
            state='MD',
            country='US',
            zipcode='20850',
        )
        self.order = Order.objects.create(
            payment_token='cs_test_purchase_email',
            subtotal=Decimal('99.00'),
            shipping_amount=Decimal('40.00'),
            tax_amount=Decimal('0.00'),
            total_price=Decimal('139.00'),
            total_paid=Decimal('139.00'),
            minimum_payment=Decimal('0.00'),
            payment_source='Made with Stripe (Visa)',
            quantity=1,
            shipping_address=self.address,
            billing_address=self.address,
            user=self.user,
            transaction_status='completed',
            paid=True,
        )
        OrderItem.objects.create(
            order=self.order,
            order_class='Products',
            product_sku='EMAIL-001',
            product_name='Email Test Product',
            unit_size='1 kit',
            unit_price=Decimal('99.00'),
            total_price=Decimal('99.00'),
            quantity=1,
            paid=True,
        )

    def test_success_email_contains_html_and_pdf_invoice(self):
        self.assertTrue(send_purchase_confirmation_email(self.order.order_id))

        self.order.refresh_from_db()
        self.assertEqual(self.order.purchase_email_status, 'sent')
        self.assertIsNotNone(self.order.purchase_email_sent_at)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, [self.user.email])
        self.assertEqual(message.cc, ['notifications@example.com'])
        self.assertTrue(any(content_type == 'text/html' for _, content_type in message.alternatives))
        pdf_attachments = [
            attachment for attachment in message.attachments
            if isinstance(attachment, tuple) and attachment[2] == 'application/pdf'
        ]
        self.assertEqual(len(pdf_attachments), 1)
        self.assertTrue(pdf_attachments[0][1].startswith(b'%PDF'))

    def test_repeat_processing_does_not_send_duplicate_email(self):
        self.assertTrue(send_purchase_confirmation_email(self.order.order_id))
        self.assertFalse(send_purchase_confirmation_email(self.order.order_id))
        self.assertEqual(len(mail.outbox), 1)

    @patch('orders.purchase_email.EmailMultiAlternatives.send', side_effect=RuntimeError('mail unavailable'))
    def test_email_failure_does_not_change_paid_order(self, _send):
        self.assertFalse(send_purchase_confirmation_email(self.order.order_id))

        self.order.refresh_from_db()
        self.assertTrue(self.order.paid)
        self.assertEqual(self.order.transaction_status, 'completed')
        self.assertEqual(self.order.purchase_email_status, 'failed')

    @patch('orders.views.queue_purchase_confirmation_email')
    def test_successful_checkout_queues_email_for_existing_paid_order(self, queue_email):
        session = {
            'id': self.order.payment_token,
            'payment_intent': '',
        }

        success, order = _process_successful_checkout(session)

        self.assertTrue(success)
        self.assertEqual(order.order_id, self.order.order_id)
        queue_email.assert_called_once_with(self.order.order_id)


class StripeWebhookTests(TestCase):
    def setUp(self):
        self.url = reverse('stripe_webhook')
        self.event = {
            'id': 'evt_test_checkout_completed',
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_webhook',
                    'payment_status': 'paid',
                },
            },
        }

    @patch('orders.views.STRIPE_WEBHOOK_SECRET', '')
    @patch('orders.views._handle_checkout_completed')
    def test_missing_webhook_secret_fails_closed(self, handle_checkout):
        response = self.client.post(
            self.url,
            data=json.dumps(self.event),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 503)
        handle_checkout.assert_not_called()

    @patch('orders.views.STRIPE_WEBHOOK_SECRET', 'whsec_test_placeholder')
    @patch('orders.views._handle_checkout_completed')
    @patch('orders.views.stripe.Webhook.construct_event')
    def test_signed_checkout_event_is_processed(
        self,
        construct_event,
        handle_checkout,
    ):
        construct_event.return_value = self.event

        response = self.client.post(
            self.url,
            data=json.dumps(self.event),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test-signature',
        )

        self.assertEqual(response.status_code, 200)
        construct_event.assert_called_once()
        self.assertEqual(construct_event.call_args.args[1], 'test-signature')
        self.assertEqual(construct_event.call_args.args[2], 'whsec_test_placeholder')
        handle_checkout.assert_called_once_with(self.event)

    @patch('orders.views.STRIPE_WEBHOOK_SECRET', 'whsec_test_placeholder')
    @patch('orders.views._handle_checkout_completed', side_effect=RuntimeError('database unavailable'))
    @patch('orders.views.stripe.Webhook.construct_event')
    def test_processing_failure_returns_retryable_error(
        self,
        construct_event,
        _handle_checkout,
    ):
        construct_event.return_value = self.event

        response = self.client.post(
            self.url,
            data=json.dumps(self.event),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test-signature',
        )

        self.assertEqual(response.status_code, 500)


class StripeCheckoutBillingAddressTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='checkout.customer@example.com',
            password='test-password',
            first_name='Casey',
            last_name='Customer',
        )
        self.client.force_authenticate(self.user)
        self.checkout_url = reverse('stripe_checkout')
        self.payload = {
            'cart': [{
                'sku': 'TEST-001',
                'name': 'Test Product',
                'unitSize': '1 kit',
                'price': 10,
                'quantity': 1,
                'shippingCost': 0,
            }],
            'address': {
                'address_line_1': '100 Shipping Way',
                'apt': 'Suite 1',
                'city': 'Rockville',
                'state': 'MD',
                'zipcode': '20850',
            },
        }

    @patch('orders.views.STRIPE_SECRET_KEY', 'sk_test_placeholder')
    def test_checkout_requires_a_saved_billing_address(self):
        response = self.client.post(self.checkout_url, self.payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['code'], 'billing_address_required')
        self.assertEqual(Order.objects.count(), 0)

    @patch('orders.views.STRIPE_SECRET_KEY', 'sk_test_placeholder')
    @patch('orders.views._lookup_db_price', return_value=10.0)
    @patch('orders.views.stripe.checkout.Session.create')
    def test_checkout_stores_attempt_without_creating_purchase(self, create_session, _lookup_price):
        profile_billing_address = Address.objects.create(
            address_line_1='200 Billing Avenue',
            address_line_2='Floor 3',
            city='Bethesda',
            state='MD',
            country='US',
            zipcode='20814',
        )
        self.user.billing_address = profile_billing_address
        self.user.save(update_fields=['billing_address'])
        create_session.return_value = SimpleNamespace(id='cs_test_billing', url='https://checkout.stripe.test/session')

        response = self.client.post(self.checkout_url, self.payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)
        checkout_attempt = StripeCheckoutAttempt.objects.get()
        self.assertEqual(checkout_attempt.billing_address['address_line_1'], '200 Billing Avenue')
        self.assertEqual(checkout_attempt.shipping_address['address_line_1'], '100 Shipping Way')
        self.assertEqual(checkout_attempt.stripe_session_id, 'cs_test_billing')
        stripe_arguments = create_session.call_args.kwargs
        self.assertNotIn('billing_address_collection', stripe_arguments)
        self.assertEqual(
            stripe_arguments['metadata']['checkout_attempt_id'],
            str(checkout_attempt.checkout_attempt_id),
        )
        self.assertIn(
            f'attempt_id={checkout_attempt.checkout_attempt_id}',
            stripe_arguments['cancel_url'],
        )

    @patch('orders.views.STRIPE_SECRET_KEY', 'sk_test_placeholder')
    @patch('orders.views._lookup_db_price', return_value=10.0)
    @patch('orders.views.stripe.checkout.Session.retrieve')
    @patch('orders.views.stripe.checkout.Session.create')
    def test_cancelled_checkout_deletes_attempt_without_creating_order(
        self,
        create_session,
        retrieve_session,
        _lookup_price,
    ):
        profile_billing_address = Address.objects.create(
            address_line_1='200 Billing Avenue',
            city='Bethesda',
            state='MD',
            country='US',
            zipcode='20814',
        )
        self.user.billing_address = profile_billing_address
        self.user.save(update_fields=['billing_address'])
        create_session.return_value = SimpleNamespace(id='cs_test_cancelled', url='https://checkout.stripe.test/session')
        retrieve_session.return_value = SimpleNamespace(payment_status='unpaid')

        checkout_response = self.client.post(self.checkout_url, self.payload, format='json')
        checkout_attempt = StripeCheckoutAttempt.objects.get()
        cancel_response = self.client.post(
            reverse('stripe_checkout_cancel'),
            {'checkout_attempt_id': str(checkout_attempt.checkout_attempt_id)},
            format='json',
        )

        self.assertEqual(checkout_response.status_code, 200)
        self.assertEqual(cancel_response.status_code, 200)
        self.assertEqual(cancel_response.data['status'], 'cancelled')
        self.assertEqual(StripeCheckoutAttempt.objects.count(), 0)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

    @patch('orders.views.queue_purchase_confirmation_email')
    @patch('orders.views._lookup_db_price', return_value=10.0)
    def test_paid_checkout_attempt_becomes_order(self, _lookup_price, queue_email):
        checkout_attempt = StripeCheckoutAttempt.objects.create(
            user=self.user,
            cart_items=self.payload['cart'],
            shipping_address={
                'address_line_1': '100 Shipping Way',
                'apt_suite': 'Suite 1',
                'city': 'Rockville',
                'state': 'MD',
                'zipcode': '20850',
                'country': 'US',
            },
            billing_address={
                'address_line_1': '200 Billing Avenue',
                'city': 'Bethesda',
                'state': 'MD',
                'zipcode': '20814',
                'country': 'US',
            },
            subtotal=10,
            shipping_amount=0,
            total_quantity=1,
            stripe_session_id='cs_test_paid_attempt',
        )
        session = {
            'id': 'cs_test_paid_attempt',
            'payment_intent': '',
            'metadata': {'checkout_attempt_id': str(checkout_attempt.checkout_attempt_id)},
            'payment_status': 'paid',
            'amount_total': 1000,
            'payment_method_types': ['card'],
        }

        success, order = _process_successful_checkout(session)

        self.assertTrue(success)
        self.assertTrue(order.paid)
        self.assertEqual(order.transaction_status, 'completed')
        self.assertEqual(order.user_id, self.user.id)
        self.assertEqual(order.shipping_address.address_line_1, '100 Shipping Way')
        self.assertEqual(order.billing_address.address_line_1, '200 Billing Avenue')
        self.assertEqual(OrderItem.objects.filter(order=order).count(), 1)
        self.assertEqual(StripeCheckoutAttempt.objects.count(), 0)
        queue_email.assert_called_once_with(order.order_id)
