from django.test import TestCase

from .models import GeneDesignCategory, GeneLibrary


class GeneDesignMetadataTests(TestCase):
    def test_metadata_endpoint_returns_all_six_design_steps(self):
        response = self.client.get('/api/genes/design-metadata/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            set(data),
            {
                'categories',
                'delivery_types',
                'structure_substeps',
                'target_gene_options',
                'format_types',
            },
        )
        self.assertEqual(len(data['categories']), 4)
        self.assertEqual(len(data['delivery_types']), 4)
        self.assertEqual(len(data['structure_substeps']), 6)
        self.assertEqual(len(data['target_gene_options']), 2)
        self.assertEqual(len(data['format_types']), 3)

        crispr = next(
            category
            for category in data['categories']
            if category['name'] == 'CRISPR-Cas9'
        )
        self.assertEqual(len(crispr['function_types']), 5)

        format_option_count = sum(
            len(format_type['options']) for format_type in data['format_types']
        )
        self.assertEqual(format_option_count, 6)

    def test_metadata_endpoint_excludes_inactive_values(self):
        GeneDesignCategory.objects.create(
            code='inactive-test',
            name='Inactive Test Category',
            description='This category must not be exposed.',
            is_active=False,
        )

        response = self.client.get('/api/genes/design-metadata/')

        self.assertEqual(response.status_code, 200)
        names = [item['name'] for item in response.json()['categories']]
        self.assertNotIn('Inactive Test Category', names)


class GeneLibrarySearchTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        GeneLibrary.objects.bulk_create([
            GeneLibrary(
                target_sequence='HGENE1',
                gene_name='Human kinase alpha',
                symbol='HKA',
                species='Human',
                description='Regulates cell growth signaling.',
            ),
            GeneLibrary(
                target_sequence='MGENE1',
                gene_name='Mouse phosphatase beta',
                symbol='MPB',
                species='Mouse',
                description='Controls neural differentiation.',
            ),
        ])

    def test_searches_name_and_filters_species(self):
        response = self.client.get(
            '/api/genes/gene-library/',
            {'species': 'Human', 'gene_name': 'kinase'},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['results'][0]['target_sequence'], 'HGENE1')

    def test_searches_description_without_description_filter_values(self):
        response = self.client.get(
            '/api/genes/gene-library/',
            {'description': 'neural'},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['results'][0]['target_sequence'], 'MGENE1')
