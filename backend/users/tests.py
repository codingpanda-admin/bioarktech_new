from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Address, User


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
