from django.test import TestCase

from .models import FeaturedProduct, Product


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
