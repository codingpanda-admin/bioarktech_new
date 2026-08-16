from django.core.exceptions import ValidationError
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from interface.models import ServiceMode
from products.models import CatalogGroup, FeaturedProduct, Product, ProductCategory

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
