from django.db import migrations

def populate_categories(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    
    # Mapping of ServiceMode url/slug to its category ID
    mappings = {
        # genome-editing-services
        'genome-editing-services': 'genome-editing-services',
        'genome-editing': 'genome-editing-services',
        'crispr-knockout': 'genome-editing-services',
        'crispr-targeting-knockin-service-gedt-013': 'genome-editing-services',
        'gene-tagging-service': 'genome-editing-services',
        'gene-knockout-service': 'genome-editing-services',
        'crispr-primer-editing-cbe-033': 'genome-editing-services',
        'crispr-abe-editing-gedt-031': 'genome-editing-services',
        'crispr-targeting-inducible-expression-service': 'genome-editing-services',
        'classical-inducible-expression-service': 'genome-editing-services',
        'crispr-targeting-overexp-service': 'genome-editing-services',
        'classical-overexpression-service': 'genome-editing-services',
        'rna-editing-overview-rnet': 'genome-editing-services',
        'classical-mirna-service': 'genome-editing-services',
        'crispr-rnai-service': 'genome-editing-services',
        'classical-rnai-service': 'genome-editing-services',
        'crispr-imaging-service-gedt-033': 'genome-editing-services',
        'crispr-inhibition-service-gedt-022': 'genome-editing-services',
        'crispr-activation-service-gedt-021': 'genome-editing-services',
        
        # synthesis-cloning-services
        'custom-cloning': 'synthesis-cloning-services',
        'dna-cloning-service': 'synthesis-cloning-services',
        'standard-cloning-service-pcst': 'synthesis-cloning-services',
        'bioark-complex-cloning-sevice-pcbc': 'synthesis-cloning-services',
        'bioark-vector-cloning-services': 'synthesis-cloning-services',
        'custom-cloning-pcct': 'synthesis-cloning-services',
        'subcloning-services-pcsc': 'synthesis-cloning-services',
        'plasmid-preparation-service': 'synthesis-cloning-services',
        'mutagenesis-service-plmu': 'synthesis-cloning-services',
        
        # cell-line-services
        'stable-cell-line': 'cell-line-services',
        'cell-line-generation': 'cell-line-services',
        'cell-research-service-overview': 'cell-line-services',
        'stable-single-clone-overview': 'cell-line-services',
        'inducible-expression-service': 'cell-line-services',
        'overexpression-service-2': 'cell-line-services',
        'rnai-service': 'cell-line-services',
        'crispr-exp-service': 'cell-line-services',
        'inducible-stable-clone': 'cell-line-services',
        'overexpression-stable-clone': 'cell-line-services',
        'rnai-stable-clone': 'cell-line-services',
        'crispr-stable-clone': 'cell-line-services',
        'inducible-cell-pool': 'cell-line-services',
        'overexpression-cell-pool': 'cell-line-services',
        'rnai-cell-pool': 'cell-line-services',
        'crispr-cell-pool': 'cell-line-services',
        
        # virus-packaging-services
        'lentivirus-package': 'virus-packaging-services',
        'virus-packaging-overview': 'virus-packaging-services',
        'aav-packaging-services': 'virus-packaging-services',
        'lentivirus-packaging-services': 'virus-packaging-services',
        
        # protein-purification-services
        'cho-antibody-protein-purification': 'protein-purification-services',
        '293t-antigen-protein-purification': 'protein-purification-services',
        'ecoil-protein-purification': 'protein-purification-services',
        'sf9-cell-protein-purification': 'protein-purification-services',
        
        # vector-construction-services
        'vector-construction-support': 'vector-construction-services',
        
        # functional-testing-services
        'functional-testing': 'functional-testing-services',
        
        # experiment-services
        'experiment-services': 'experiment-services',
        
        # lab-supplies-services
        'lab-supplies': 'lab-supplies-services',
        'mrna-lnp-packaging-service': 'lab-supplies-services',
        
        # project-consultation-services
        'project-consultation': 'project-consultation-services',
    }
    
    for url, cat_id in mappings.items():
        ServiceMode.objects.filter(url=url).update(category=cat_id)

class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0014_set_default_show_on_screen'),
    ]

    operations = [
        migrations.RunPython(populate_categories),
    ]
