from types import SimpleNamespace
from unittest.mock import patch

from django.core import mail
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from interface.models import ServiceMode
from products.models import CatalogGroup, FeaturedProduct, Product, ProductCategory
from users.models import User

from .admin_views import (
    _normalize_product_manual_payload,
    _normalize_service_manuals,
    _serialize_product_manuals,
)
from .views import _search_match_score
from .bulk_upload import _import_product, _import_service


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='sender@example.com',
    EMAIL_NOTIFICATION_RECIPIENT='notifications@example.com',
)
class QuoteNotificationEmailTests(SimpleTestCase):
    @patch('quote.views.create_quote_record')
    def test_submitted_quote_notifies_internal_recipient_only(self, create_quote_record):
        create_quote_record.return_value = SimpleNamespace(
            id=17,
            external_id='quote-notification-test',
            first_name='Test',
            last_name='Customer',
            email='customer@example.com',
            phone=None,
            company=None,
            department=None,
            service_type=None,
            timeline=None,
            budget=None,
            project_description='Test quote request',
            additional_info=None,
        )

        response = APIClient().post(reverse('create-quote'), {
            'externalId': 'quote-notification-test',
            'firstName': 'Test',
            'lastName': 'Customer',
            'email': 'customer@example.com',
            'projectDescription': 'Test quote request',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['emailSent'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['notifications@example.com'])

    @patch('quote.views.create_quote_record')
    def test_contact_message_uses_quote_recipient_with_contact_wording(self, create_quote_record):
        create_quote_record.return_value = SimpleNamespace(
            id=19,
            external_id='contact-notification-test',
            first_name='Test',
            last_name='Customer',
            email='customer@example.com',
            phone=None,
            company='Example Lab',
            department=None,
            service_type='Contact Us',
            timeline=None,
            budget=None,
            project_description=None,
            additional_info='Please contact me about my order.',
        )

        response = APIClient().post(reverse('create-quote'), {
            'externalId': 'contact-notification-test',
            'firstName': 'Test',
            'lastName': 'Customer',
            'email': 'customer@example.com',
            'company': 'Example Lab',
            'serviceType': 'Contact Us',
            'additionalInfo': 'Please contact me about my order.',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['emailSent'])
        self.assertEqual(mail.outbox[0].to, ['notifications@example.com'])
        self.assertEqual(mail.outbox[0].subject, 'New Contact Message from Bioark Tech')
        self.assertIn('Message:\n', mail.outbox[0].body)
        self.assertNotIn('Service Type:', mail.outbox[0].body)

    @patch('quote.views.send_quote_notification', side_effect=RuntimeError('SES unavailable'))
    @patch('quote.views.create_quote_record')
    def test_quote_remains_saved_when_notification_fails(self, create_quote_record, _send_notification):
        create_quote_record.return_value = SimpleNamespace(
            id=18,
            external_id='quote-email-failure-test',
        )

        response = APIClient().post(reverse('create-quote'), {
            'externalId': 'quote-email-failure-test',
            'firstName': 'Test',
            'lastName': 'Customer',
            'email': 'customer@example.com',
            'projectDescription': 'Test quote request',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.json()['emailSent'])
        create_quote_record.assert_called_once()

    def test_legacy_singular_quote_endpoint_is_retired(self):
        response = APIClient().post('/api/quote/', {}, format='json')

        self.assertEqual(response.status_code, 404)

class ProductManualPayloadTests(SimpleTestCase):
    def test_uploaded_document_name_is_kept_separate_from_its_path(self):
        original, names, urls = _normalize_product_manual_payload([
            {
                'name': 'CRISPR RNA KnockDown Protocol',
                'manual': 'media/manual_files/protocol-v2.pdf',
            },
        ])

        self.assertEqual(names, ['CRISPR RNA KnockDown Protocol'])
        self.assertEqual(urls, ['media/manual_files/protocol-v2.pdf'])
        self.assertEqual(original, [{
            'name': 'CRISPR RNA KnockDown Protocol',
            'manual': 'media/manual_files/protocol-v2.pdf',
        }])

    def test_legacy_duplicate_path_values_load_with_a_readable_name(self):
        product = type('ProductStub', (), {
            'manuals': ['media/manual_files/protocol-v2.pdf'],
            'manual_urls': ['media/manual_files/protocol-v2.pdf'],
        })()

        self.assertEqual(_serialize_product_manuals(product), [{
            'name': 'protocol-v2.pdf',
            'manual': 'media/manual_files/protocol-v2.pdf',
        }])

    def test_service_document_name_is_preserved(self):
        self.assertEqual(_normalize_service_manuals([{
            'name': 'Stable Cell Line Service Protocol',
            'manual': 'media/manual_files/internal-service-file.pdf',
        }]), [{
            'name': 'Stable Cell Line Service Protocol',
            'manual': 'media/manual_files/internal-service-file.pdf',
        }])


class SearchMatchingTests(SimpleTestCase):
    def test_catalog_code_ignores_case_spaces_and_punctuation(self):
        fields = {
            'identifiers': ['RNDT-021k'],
            'names': ['CRISPR RNA KnockDown Kit'],
            'groups': [],
            'keywords': [],
        }
        self.assertIsNotNone(_search_match_score('rndt 021K', fields))

    def test_every_search_term_must_be_present(self):
        fields = {
            'identifiers': ['GEDT-022k'],
            'names': ['CRISPR Activation Kit'],
            'groups': [],
            'keywords': [],
        }
        self.assertIsNone(_search_match_score('CRISPR KnockOut Kit', fields))

    def test_exact_name_scores_above_description_only_match(self):
        exact_fields = {
            'identifiers': [],
            'names': ['THUNDERBIRD Probe qPCR Mix'],
            'groups': [],
            'keywords': [],
        }
        description_fields = {
            'identifiers': [],
            'names': ['General PCR Reagent'],
            'groups': [],
            'keywords': ['Compatible with THUNDERBIRD Probe qPCR Mix workflows'],
        }
        self.assertGreater(
            _search_match_score('THUNDERBIRD Probe qPCR Mix', exact_fields),
            _search_match_score('THUNDERBIRD Probe qPCR Mix', description_fields),
        )


class CatalogBulkUploadTests(TestCase):
    def setUp(self):
        self.product_category = ProductCategory.objects.create(
            category_name='Bulk Products',
            external_id='bulk-products',
            product_type='product',
        )
        self.reagent_category = ProductCategory.objects.create(
            category_name='Bulk Reagents',
            external_id='bulk-reagents',
            product_type='reagent',
        )
        self.service_category = ProductCategory.objects.create(
            category_name='Bulk Services',
            external_id='bulk-services',
            product_type='service',
        )
        self.product_group = CatalogGroup.objects.create(
            category=self.product_category,
            group_name='Bulk Product Group',
        )
        self.service_group = CatalogGroup.objects.create(
            category=self.service_category,
            group_name='Bulk Service Group',
        )

    def test_product_update_imports_one_option_and_preserves_media_documents(self):
        product = Product.objects.create(
            external_id='bulk-existing-product',
            product_name='Old Name',
            category=self.product_category,
            source_type='quote',
            options=['Old A', 'Old B'],
            option_prices={'Old A': '10', 'Old B': '20'},
            images=['media/product_images/keep.png'],
            manuals=['Keep Manual'],
            manual_urls=['media/manual_files/keep.pdf'],
        )

        created, _, _ = _import_product({
            'external_id': product.external_id,
            'product_name': 'Imported Product',
            'category_external_id': self.product_category.external_id,
            'group_external_id': self.product_group.external_id,
            'details': 'Plain text details',
            'list_price': '25',
            'first_option_name': '100 tests',
            'first_option_list_price': '20',
            'active': 'Yes',
        }, 'product')

        product.refresh_from_db()
        self.assertFalse(created)
        self.assertEqual(product.options, ['100 tests'])
        self.assertEqual(product.option_prices, {'100 tests': '20'})
        self.assertEqual(product.images, ['media/product_images/keep.png'])
        self.assertEqual(product.manuals, ['Keep Manual'])
        self.assertEqual(product.manual_urls, ['media/manual_files/keep.pdf'])
        self.assertEqual(product.content_text, 'Plain text details')

    def test_reagent_import_creates_a_reagent(self):
        created, external_id, _ = _import_product({
            'external_id': 'bulk-new-reagent',
            'product_name': 'Imported Reagent',
            'category_external_id': self.reagent_category.external_id,
        }, 'reagent')

        reagent = Product.objects.get(external_id=external_id)
        self.assertTrue(created)
        self.assertEqual(reagent.source_type, 'reagent')
        self.assertEqual(reagent.category_id, self.reagent_category.category_id)

    def test_service_update_preserves_media_documents(self):
        service = ServiceMode.objects.create(
            url='bulk-existing-service',
            title='Old Service',
            content='Old content',
            category_ref=self.service_category,
            manuals=[{'name': 'Keep PDF', 'manual': 'media/manual_files/keep.pdf'}],
            videos=['media/service-videos/keep.mp4'],
        )

        created, _, _ = _import_service({
            'external_id': service.url,
            'service_name': 'Imported Service',
            'category_external_id': self.service_category.external_id,
            'group_external_id': self.service_group.external_id,
            'service_details': 'Plain service details',
            'price': '$125',
            'active': 'Yes',
        })

        service.refresh_from_db()
        self.assertFalse(created)
        self.assertEqual(service.content, 'Plain service details')
        self.assertEqual(service.manuals, [{'name': 'Keep PDF', 'manual': 'media/manual_files/keep.pdf'}])
        self.assertEqual(service.videos, ['media/service-videos/keep.mp4'])

    def test_product_template_cannot_reclassify_a_reagent(self):
        Product.objects.create(
            external_id='bulk-type-guard',
            product_name='Existing Reagent',
            category=self.reagent_category,
            source_type='reagent',
        )

        with self.assertRaisesMessage(ValueError, 'already belongs to a reagent'):
            _import_product({
                'external_id': 'bulk-type-guard',
                'product_name': 'Wrong Type',
                'category_external_id': self.product_category.external_id,
            }, 'product')

class CatalogSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.target = Product.objects.create(
            external_id='search-target',
            product_name='Alpha CRISPR KnockOut Kit',
            catalog_number='ABC-0123-X',
            description='<p>Precise genome editing for difficult cell lines.</p>',
            key_features=['high editing efficiency', 'validated workflow'],
            source_type='product',
        )
        Product.objects.create(
            external_id='search-noise',
            product_name='Alpha CRISPR Screening Reagent',
            catalog_number='NOISE-9',
            description='General purpose kit for screening experiments.',
            source_type='reagent',
        )
        Product.objects.create(
            external_id='search-hidden',
            product_name='Secret Keyword Product',
            catalog_number='HIDDEN-001',
            description='privatekeyword',
            hidden=True,
        )
        ServiceMode.objects.create(
            title='Beta Cell Engineering Service',
            url='beta-cell-engineering',
            catalog_number='SVC-204',
            content='<p>Custom beta cell engineering and validation.</p>',
        )

    def search(self, query):
        response = self.client.get(reverse('search'), {'q': query, 'page_size': 100})
        self.assertEqual(response.status_code, 200)
        return response.json()['products']

    def test_exact_product_name_ranks_first_over_partial_keyword_matches(self):
        results = self.search('Alpha CRISPR KnockOut Kit')
        self.assertEqual(results[0]['external_id'], self.target.external_id)

    def test_catalog_number_matches_without_separators(self):
        results = self.search('abc 0123 x')
        self.assertEqual([item['external_id'] for item in results], [self.target.external_id])

    def test_product_keyword_fields_are_searchable(self):
        results = self.search('validated workflow')
        self.assertEqual(results[0]['external_id'], self.target.external_id)

    def test_service_catalog_number_is_searchable(self):
        results = self.search('svc204')
        self.assertEqual(results[0]['external_id'], 'beta-cell-engineering')
        self.assertEqual(results[0]['catalog_number'], 'SVC-204')

    def test_hidden_items_are_excluded(self):
        self.assertEqual(self.search('privatekeyword'), [])

    def test_featured_result_falls_back_to_canonical_product_image(self):
        image_path = '/content-api/uploads/originals/gene-deletion-kit.png'
        product = Product.objects.create(
            external_id='gep-03',
            product_name='CRISPR Gene Deletion Kit',
            catalog_number='GEDT-012k',
            source_type='product',
            images=[image_path],
            is_featured=True,
        )
        FeaturedProduct.objects.create(
            catalog_number=product.catalog_number,
            product_name=product.product_name,
            description='',
            key_features='',
            performance_data='',
            storage_info='',
            ship_info='',
            shelf_status=True,
            units_in_stock=0,
            units='',
        )

        results = self.search('CRISPR Gene Deletion Kit')
        result = next(item for item in results if item['external_id'] == product.external_id)

        self.assertEqual(result['image'], image_path)
        self.assertEqual(result['image_candidates'], [image_path])


class CatalogHierarchyTests(TestCase):
    def setUp(self):
        self.product_category = ProductCategory.objects.create(
            category_name='Hierarchy Products',
            external_id='hierarchy-products',
            product_type='product',
        )
        self.other_category = ProductCategory.objects.create(
            category_name='Other Hierarchy Products',
            external_id='other-hierarchy-products',
            product_type='product',
        )
        self.service_category = ProductCategory.objects.create(
            category_name='Hierarchy Services',
            external_id='hierarchy-services',
            product_type='service',
        )

    def test_product_text_group_is_normalized_under_its_category(self):
        product = Product.objects.create(
            external_id='normalized-product',
            product_name='Normalized Product',
            category_external_id=self.product_category.external_id,
            product_group='Gene Editing Tools',
            source_type='product',
        )

        self.assertEqual(product.category_id, self.product_category.category_id)
        self.assertEqual(product.catalog_group.category_id, self.product_category.category_id)
        self.assertEqual(product.catalog_group.normalized_name, 'gene-editing-tools')

    def test_product_rejects_group_from_another_category(self):
        other_group = CatalogGroup.objects.create(
            category=self.other_category,
            group_name='Other Group',
        )
        product = Product(
            external_id='invalid-product-hierarchy',
            product_name='Invalid Product Hierarchy',
            category=self.product_category,
            catalog_group=other_group,
            source_type='product',
        )

        with self.assertRaises(ValidationError):
            product.save()

    def test_service_group_is_normalized_under_service_category(self):
        service = ServiceMode.objects.create(
            url='normalized-service',
            title='Normalized Service',
            content='',
            category=self.service_category.external_id,
            service_group='Cell Engineering',
        )

        self.assertEqual(service.category_ref_id, self.service_category.category_id)
        self.assertEqual(service.catalog_group.category_id, self.service_category.category_id)
        self.assertEqual(service.catalog_group.normalized_name, 'cell-engineering')


class CatalogGroupExternalIdAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='catalog-group-admin@example.com',
            password='test-password',
            is_admin=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.product_category = ProductCategory.objects.create(
            category_name='Editable Product Groups',
            external_id='editable-product-groups',
            product_type='product',
        )
        self.service_category = ProductCategory.objects.create(
            category_name='Editable Service Groups',
            external_id='editable-service-groups',
            product_type='service',
        )
        self.product_group = CatalogGroup.objects.create(
            category=self.product_category,
            group_name='Original Product Group',
        )

    def test_admin_can_edit_product_group_external_id(self):
        response = self.client.post(
            f'/api/admin-panel/catalog-groups/{self.product_group.group_id}/update/',
            {
                'group_name': self.product_group.group_name,
                'external_id': 'product-renamed-group',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.product_group.refresh_from_db()
        self.assertEqual(self.product_group.external_id, 'product-renamed-group')
        self.assertEqual(response.data['external_id'], 'product-renamed-group')

    def test_admin_can_create_service_group_with_custom_external_id(self):
        response = self.client.post(
            '/api/admin-panel/catalog-groups/create/',
            {
                'category_external_id': self.service_category.external_id,
                'group_name': 'Custom Service Group',
                'external_id': 'service-custom-group-id',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['external_id'], 'service-custom-group-id')

    def test_duplicate_group_external_id_is_rejected(self):
        duplicate_group = CatalogGroup.objects.create(
            category=self.service_category,
            group_name='Duplicate Target',
        )

        response = self.client.post(
            f'/api/admin-panel/catalog-groups/{self.product_group.group_id}/update/',
            {
                'group_name': self.product_group.group_name,
                'external_id': duplicate_group.external_id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.product_group.refresh_from_db()
        self.assertNotEqual(self.product_group.external_id, duplicate_group.external_id)

    def test_invalid_group_external_id_is_rejected(self):
        response = self.client.post(
            f'/api/admin-panel/catalog-groups/{self.product_group.group_id}/update/',
            {
                'group_name': self.product_group.group_name,
                'external_id': 'invalid group id',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
