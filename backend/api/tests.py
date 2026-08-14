from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from interface.models import ServiceMode
from products.models import Product

from .admin_views import (
    _normalize_product_manual_payload,
    _normalize_service_manuals,
    _serialize_product_manuals,
)
from .views import _search_match_score


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
