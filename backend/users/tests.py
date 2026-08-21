from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Address, CustomerShippingAddress, User


class BillingAddressApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='billing@example.com', password='test-password')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/users/billing-address/'
        self.payload = {
            'address_line_1': '123 Main Street',
            'address_line_2': 'Floor 2',
            'apt_suite': 'Suite 200',
            'city': 'Rockville',
            'state': 'MD',
            'zipcode': '20850',
            'country': 'US',
        }

    def test_create_billing_address(self):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['created'])
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.billing_address_id)
        self.assertEqual(response.data['user']['billing_address']['city'], 'Rockville')

    def test_subsequent_save_updates_the_same_billing_address(self):
        first_response = self.client.post(self.url, self.payload, format='json')
        first_address_id = first_response.data['billing_address']['id']
        address_count = Address.objects.count()

        updated_payload = {**self.payload, 'address_line_1': '456 Updated Avenue'}
        second_response = self.client.put(self.url, updated_payload, format='json')

        self.assertEqual(second_response.status_code, 200)
        self.assertFalse(second_response.data['created'])
        self.assertEqual(second_response.data['billing_address']['id'], first_address_id)
        self.assertEqual(Address.objects.count(), address_count)
        self.assertEqual(second_response.data['billing_address']['address_line_1'], '456 Updated Avenue')

    def test_anonymous_user_cannot_save_billing_address(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, 401)


class DefaultShippingAddressApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='shipping@example.com', password='test-password')
        self.client.force_authenticate(user=self.user)
        self.first_address = CustomerShippingAddress.objects.create(
            user=self.user,
            nickname='Home',
            first_name='Alex',
            last_name='Customer',
            address_line_1='100 First Street',
            city='Rockville',
            state='MD',
            postal_code='20850',
            is_default=True,
        )
        self.second_address = CustomerShippingAddress.objects.create(
            user=self.user,
            nickname='Office',
            first_name='Alex',
            last_name='Customer',
            address_line_1='200 Second Street',
            city='Bethesda',
            state='MD',
            postal_code='20814',
            is_default=False,
        )

    def test_set_default_switches_address_and_returns_canonical_list(self):
        response = self.client.post(
            f'/api/users/shipping-addresses/{self.second_address.id}/set-default/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.first_address.refresh_from_db()
        self.second_address.refresh_from_db()
        self.user.refresh_from_db()
        self.assertFalse(self.first_address.is_default)
        self.assertTrue(self.second_address.is_default)
        self.assertEqual(
            CustomerShippingAddress.objects.filter(user=self.user, is_default=True).count(),
            1,
        )
        self.assertEqual(response.data['shipping_addresses'][0]['id'], self.second_address.id)
        self.assertEqual(self.user.shipping_address.city, 'Bethesda')

    def test_user_cannot_set_another_users_address_as_default(self):
        another_user = User.objects.create_user(email='other-shipping@example.com')
        other_address = CustomerShippingAddress.objects.create(
            user=another_user,
            nickname='Other',
            first_name='Other',
            last_name='Customer',
            address_line_1='300 Third Street',
            city='Baltimore',
            state='MD',
            postal_code='21201',
        )

        response = self.client.post(
            f'/api/users/shipping-addresses/{other_address.id}/set-default/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 404)
        self.first_address.refresh_from_db()
        self.assertTrue(self.first_address.is_default)
