from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APITestCase

from products.models import FeaturedProduct, Product
from users.models import Address, User

from .models import Order, OrderItem
from .views import _lookup_db_price


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
    def test_checkout_snapshots_billing_address_without_changing_stripe_collection(self, create_session, _lookup_price):
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
        order = Order.objects.get()
        self.assertNotEqual(order.billing_address_id, profile_billing_address.id)
        self.assertNotEqual(order.billing_address_id, order.shipping_address_id)
        self.assertEqual(order.billing_address.address_line_1, '200 Billing Avenue')
        stripe_arguments = create_session.call_args.kwargs
        self.assertNotIn('billing_address_collection', stripe_arguments)
