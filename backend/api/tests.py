from django.test import SimpleTestCase

from .admin_views import (
    _normalize_product_manual_payload,
    _normalize_service_manuals,
    _serialize_product_manuals,
)


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
