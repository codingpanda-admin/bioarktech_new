from django.db import migrations, models


SERVICE_GROUPS = {
    # Genome Editing Services
    'genome-editing-services': 'Genome Editing Overview & Tools',
    'genome-editing': 'Genome Editing Overview & Tools',
    'crispr-knockout': 'Genome Editing Overview & Tools',
    'crispr-targeting-knockin-service-gedt-013': 'Genome Editing Overview & Tools',
    'gene-tagging-service': 'Gene Engineering',
    'gene-knockout-service': 'Gene Engineering',
    'crispr-primer-editing-cbe-033': 'Gene Engineering',
    'crispr-abe-editing-gedt-031': 'Gene Engineering',
    'crispr-targeting-inducible-expression-service': 'Inducible & Overexpression',
    'classical-inducible-expression-service': 'Inducible & Overexpression',
    'crispr-targeting-overexp-service': 'Inducible & Overexpression',
    'classical-overexpression-service': 'Inducible & Overexpression',
    'rna-editing-overview-rnet': 'RNA & miRNA Editing',
    'classical-mirna-service': 'RNA & miRNA Editing',
    'crispr-rnai-service': 'RNA & miRNA Editing',
    'classical-rnai-service': 'RNA & miRNA Editing',
    'crispr-imaging-service-gedt-033': 'CRISPR Imaging & Regulation',
    'crispr-inhibition-service-gedt-022': 'CRISPR Imaging & Regulation',
    'crispr-activation-service-gedt-021': 'CRISPR Imaging & Regulation',

    # Custom Cloning Services
    'custom-cloning': 'Cloning Services',
    'dna-cloning-service': 'Cloning Services',
    'standard-cloning-service-pcst': 'Cloning Services',
    'bioark-complex-cloning-sevice-pcbc': 'Cloning Services',
    'bioark-vector-cloning-services': 'Cloning Services',
    'custom-cloning-pcct': 'Cloning Services',
    'subcloning-services-pcsc': 'Cloning Services',
    'plasmid-preparation-service': 'Plasmid Prep & Mutagenesis',
    'mutagenesis-service-plmu': 'Plasmid Prep & Mutagenesis',

    # Stable Cell Line Services
    'stable-cell-line': 'Cell Line Generation & Research',
    'cell-line-generation': 'Cell Line Generation & Research',
    'cell-research-service-overview': 'Cell Line Generation & Research',
    'stable-single-clone-overview': 'Cell Line Generation & Research',
    'inducible-expression-service': 'Cell Expression Services',
    'overexpression-service-2': 'Cell Expression Services',
    'rnai-service': 'Cell Expression Services',
    'crispr-exp-service': 'Cell Expression Services',
    'inducible-stable-clone': 'Stable Single Clones',
    'overexpression-stable-clone': 'Stable Single Clones',
    'rnai-stable-clone': 'Stable Single Clones',
    'crispr-stable-clone': 'Stable Single Clones',
    'inducible-cell-pool': 'Stable Cell Pools',
    'overexpression-cell-pool': 'Stable Cell Pools',
    'rnai-cell-pool': 'Stable Cell Pools',
    'crispr-cell-pool': 'Stable Cell Pools',

    # Remaining service categories
    'lentivirus-package': 'Viral Vector Packaging',
    'virus-packaging-overview': 'Viral Vector Packaging',
    'aav-packaging-services': 'Viral Vector Packaging',
    'lentivirus-packaging-services': 'Viral Vector Packaging',
    'cho-antibody-protein-purification': 'Mammalian Cell Purification',
    '293t-antigen-protein-purification': 'Mammalian Cell Purification',
    'ecoil-protein-purification': 'Bacterial & Insect Purification',
    'sf9-cell-protein-purification': 'Bacterial & Insect Purification',
    'vector-construction-support': 'Vector Support',
    'functional-testing': 'Functional Validation',
    'experiment-services': 'Research Support',
    'lab-supplies': 'Laboratory Consumables',
    'mrna-lnp-packaging-service': 'Laboratory Consumables',
    'project-consultation': 'Consultation Services',
}


def populate_service_groups(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    for service_url, service_group in SERVICE_GROUPS.items():
        ServiceMode.objects.filter(url=service_url).update(service_group=service_group)


def clear_service_groups(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')
    ServiceMode.objects.update(service_group=None)


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0015_populate_service_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicemode',
            name='service_group',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.RunPython(populate_service_groups, clear_service_groups),
    ]
