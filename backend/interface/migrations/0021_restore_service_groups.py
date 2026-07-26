from django.db import migrations


SERVICE_GROUPS = {
    '293t-antigen-protein-purification': '3-Mammalian Cell',
    'aav-packaging-services': 'AAV',
    'bioark-complex-cloning-sevice-pcbc': 'Cloning',
    'bioark-vector-cloning-services': 'Cloning',
    'cell-line-generation': 'Stable Cell Pool',
    'cell-research-service-overview': 'Cell Exp Service',
    'cho-antibody-protein-purification': '3-Mammalian Cell',
    'classical-inducible-expression-service': 'Inducible Exp',
    'classical-mirna-service': 'RNA Editing',
    'classical-overexpression-service': 'Over Exp',
    'classical-rnai-service': 'RNA Editing',
    'crispr-abe-editing-gedt-031': 'CRISPR',
    'crispr-activation-service-gedt-021': 'CRISPR',
    'crispr-cell-pool': 'Stable Cell Pool',
    'crispr-exp-service': 'Cell Exp Service',
    'crispr-imaging-service-gedt-033': 'CRISPR',
    'crispr-inhibition-service-gedt-022': 'CRISPR',
    'crispr-knockout': 'CRISPR',
    'crispr-primer-editing-cbe-033': 'CRISPR',
    'crispr-rnai-service': 'RNA Editing',
    'crispr-stable-clone': 'Stable Single Clone',
    'crispr-targeting-inducible-expression-service': 'Inducible Exp',
    'crispr-targeting-knockin-service-gedt-013': 'CRISPR',
    'crispr-targeting-overexp-service': 'Over Exp',
    'custom-cloning': '0-Overview',
    'custom-cloning-pcct': 'Cloning',
    'dna-cloning-service': 'Cloning',
    'ecoil-protein-purification': '1-Prokaryotic Cell',
    'gene-knockout-service': 'CRISPR',
    'gene-tagging-service': 'CRISPR',
    'genome-editing': 'CRISPR',
    'inducible-cell-pool': 'Stable Cell Pool',
    'inducible-expression-service': 'Cell Exp Service',
    'inducible-stable-clone': 'Stable Single Clone',
    'lentivirus-packaging-services': 'Lentivirus',
    'mutagenesis-service-plmu': 'Mutagenesis',
    'overexpression-cell-pool': 'Stable Cell Pool',
    'overexpression-service-2': 'Cell Exp Service',
    'overexpression-stable-clone': 'Stable Single Clone',
    'plasmid-preparation-service': 'Plasmid Prep',
    'rna-editing-overview-rnet': 'RNA Editing',
    'rnai-cell-pool': 'Stable Cell Pool',
    'rnai-service': 'Cell Exp Service',
    'rnai-stable-clone': 'Stable Single Clone',
    'sf9-cell-protein-purification': '2-Insect Cell',
    'stable-single-clone-overview': 'Stable Single Clone',
    'standard-cloning-service-pcst': 'Cloning',
    'subcloning-services-pcsc': 'Cloning',
    'virus-packaging-overview': '0-Overview',
}


def restore_service_groups(apps, schema_editor):
    ServiceMode = apps.get_model('interface', 'ServiceMode')

    for service_url, service_group in SERVICE_GROUPS.items():
        ServiceMode.objects.filter(url=service_url).update(service_group=service_group)


class Migration(migrations.Migration):

    dependencies = [
        ('interface', '0020_servicemode_manuals'),
    ]

    operations = [
        migrations.RunPython(restore_service_groups, migrations.RunPython.noop),
    ]
