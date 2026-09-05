import unittest

from products.media_utils import dedupe_product_images


class ProductImageAliasTests(unittest.TestCase):
    def test_production_four_image_sequence_is_not_repeated(self):
        filenames = [
            '66fabe10-05a9-48f1-aeb1-31e2f16acc8b.png',
            '73bdfa65-3188-4710-a83a-0786c9542d6c.webp',
            'c69ea06d-5fc6-455c-a7a1-7e03b07257f9.webp',
            'ead73089-ac2d-413f-9317-cbddfcc8cdb7.webp',
        ]
        legacy = [{'image': '/media/product_images/' + name, 'id': i}
                  for i, name in enumerate(filenames)]
        imported = ['/content-api/uploads/originals/' + name for name in filenames]
        self.assertEqual(dedupe_product_images(legacy + imported), legacy)

    def test_encoded_absolute_and_relative_aliases_match(self):
        urls = ['/media/product_images/kit photo.png',
                'https://www.bioarktech.com/media/kit%20photo.png?cache=1',
                '/content-api/uploads/originals/kit%20photo.png']
        self.assertEqual(dedupe_product_images(urls), urls[:1])

    def test_distinct_images_and_external_hosts_are_preserved(self):
        urls = ['/media/product_images/kit.png', '/media/product_images/gel.png',
                'https://other.example/media/kit.png', '/media/other/kit.png']
        self.assertEqual(dedupe_product_images(urls), urls)

    def test_empty_entries_and_repeated_primary_image(self):
        image = {'image_url': '/media/product_images/kit.png'}
        self.assertEqual(dedupe_product_images([None, '', {}, image, image]), [image])
