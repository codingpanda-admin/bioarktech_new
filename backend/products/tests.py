from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase, TestCase

from interface.models import ServiceMode

from .models import FeaturedProduct, ManualFile, Product
from .views import _get_product_documents, _get_service_documents


class ProductDiscountValidationTests(SimpleTestCase):
    def test_discounted_price_cannot_exceed_list_price(self):
        product = Product(
            external_id='invalid-discount',
            product_name='Invalid discount',
            list_price='$100.00',
            discounted_price='$101.00',
        )

        with self.assertRaisesMessage(ValidationError, 'cannot exceed List Price'):
            product.clean()

    def test_option_discount_uses_the_option_list_price(self):
        product = Product(
            external_id='invalid-option-discount',
            product_name='Invalid option discount',
            list_price='$100.00',
            options=['Large'],
            option_prices={'Large': '$150.00'},
            option_discounted_prices={'Large': '$151.00'},
        )

        with self.assertRaisesMessage(ValidationError, 'cannot exceed its List Price'):
            product.clean()

    def test_equal_discounted_price_is_allowed(self):
        product = Product(
            external_id='equal-discount',
            product_name='Equal discount',
            list_price='100',
            discounted_price='100',
        )

        product.clean()


class CatalogDocumentNormalizationTests(SimpleTestCase):
    def test_reagent_document_uses_its_saved_display_name(self):
        reagent = SimpleNamespace(
            manuals=['Reagent Safety Data Sheet'],
            manual_urls=['media/manual_files/internal-reagent-file.pdf'],
        )

        self.assertEqual(_get_product_documents(product=reagent), [{
            'name': 'Reagent Safety Data Sheet',
            'url': 'media/manual_files/internal-reagent-file.pdf',
            'type': 'Product Document',
        }])

    def test_service_document_uses_its_saved_display_name(self):
        self.assertEqual(_get_service_documents([{
            'name': 'Service Performance Guide',
            'manual': 'media/manual_files/internal-service-file.pdf',
        }]), [{
            'name': 'Service Performance Guide',
            'url': 'media/manual_files/internal-service-file.pdf',
            'type': 'Service Document',
        }])

    def test_legacy_service_path_gets_a_readable_name(self):
        self.assertEqual(_get_service_documents([
            'media/manual_files/legacy%20service%20guide.pdf',
        ]), [{
            'name': 'legacy service guide.pdf',
            'url': 'media/manual_files/legacy%20service%20guide.pdf',
            'type': 'Service Document',
        }])


class ProductDetailImageTests(TestCase):
    def test_canonical_images_are_used_when_legacy_featured_record_has_none(self):
        image_paths = [
            '/content-api/uploads/originals/main.webp',
            '/content-api/uploads/originals/detail.jpg',
        ]
        Product.objects.create(
            external_id='reagent-with-images',
            product_name='Reagent with images',
            catalog_number='REAGENT-001',
            source_type='reagent',
            image_url=image_paths[0],
            images=image_paths,
        )
        FeaturedProduct.objects.create(
            catalog_number='REAGENT-001',
            product_name='Legacy reagent',
            description='',
            key_features='',
            performance_data='',
            storage_info='',
            ship_info='',
            shelf_status=True,
            units_in_stock=0,
            units='',
        )

        response = self.client.get('/api/products/load-product-by-external-id/reagent-with-images/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['image_url'], image_paths[0])
        self.assertEqual(response.data['images'], image_paths)

    def test_detail_response_includes_item_and_option_discounts(self):
        Product.objects.create(
            external_id='discounted-reagent',
            product_name='Discounted reagent',
            source_type='reagent',
            list_price='$100.00',
            discounted_price='$80.00',
            options=['1 kit'],
            option_prices={'1 kit': '$50.00'},
            option_discounted_prices={'1 kit': '$40.00'},
        )

        response = self.client.get('/api/products/load-product-by-external-id/discounted-reagent/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['discounted_price'], '$80.00')
        self.assertEqual(response.data['option_discounted_prices'], {'1 kit': '$40.00'})


class ProductDetailDocumentTests(TestCase):
    def test_canonical_product_document_uses_its_saved_display_name(self):
        Product.objects.create(
            external_id='product-with-named-document',
            product_name='Product with named document',
            manuals=['Customer-facing protocol name'],
            manual_urls=['media/manual_files/internal-upload-name.pdf'],
        )

        response = self.client.get(
            '/api/products/load-product-by-external-id/product-with-named-document/'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['documents'], [{
            'name': 'Customer-facing protocol name',
            'url': 'media/manual_files/internal-upload-name.pdf',
            'type': 'Product Document',
        }])

    def test_legacy_and_canonical_copies_of_documents_are_returned_once(self):
        document_paths = [
            'Protocol Guide (PDF)',
            'Troubleshooting (PDF)',
            'media/manual_files/BioArkTech website requirements_v2.pdf',
        ]
        product = Product.objects.create(
            external_id='crispr-rna-knockdown-kit',
            product_name='CRISPR RNA KnockDown Kit',
            catalog_number='RNDT-021k',
            manuals=document_paths,
            manual_urls=document_paths,
        )
        featured_product = FeaturedProduct.objects.create(
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
        ManualFile.objects.create(
            union=featured_product.union,
            name='Protocol Guide (PDF)',
            manual='Protocol Guide (PDF)',
        )
        ManualFile.objects.create(
            union=featured_product.union,
            name='Troubleshooting (PDF)',
            manual='Troubleshooting (PDF)',
        )
        ManualFile.objects.create(
            union=featured_product.union,
            name='BioArkTech website requirements_v2',
            manual='manual_files/BioArkTech website requirements_v2.pdf',
        )

        response = self.client.get(
            '/api/products/load-product-by-external-id/crispr-rna-knockdown-kit/'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['documents']), 3)
        self.assertEqual(
            [document['name'] for document in response.data['documents']],
            [
                'Protocol Guide (PDF)',
                'Troubleshooting (PDF)',
                'BioArkTech website requirements_v2',
            ],
        )


class ServiceTechniqueDetailTests(TestCase):
    def test_service_detail_response_includes_rich_technique_content(self):
        ServiceMode.objects.create(
            url='technique-enabled-service',
            title='Technique Enabled Service',
            content='<p>Service overview</p>',
            technique='<h2>Technique</h2><p>Validated workflow</p>',
        )

        response = self.client.get(
            '/api/products/load-product-by-external-id/technique-enabled-service/'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data['technique'],
            '<h2>Technique</h2><p>Validated workflow</p>',
        )
