import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from interface.models import ServiceMode

print("Populating and categorizing services...")

# 1. Update existing services
service_mappings = {
    'Genome Editing Services': 'genome-editing',
    'Gene Editing Services': 'genome-editing',
    
    'Synthesis & Cloning Services': 'synthesis-cloning',
    'DNA Cloning Service': 'synthesis-cloning',
    
    'Lentivirus Package Services': 'virus-packaging',
    'Lentivirus Packaging Services': 'virus-packaging',
    'AAV Packaging Services': 'virus-packaging',
    'Virus Packaging Overview': 'virus-packaging',
    
    'Cell Line Services': 'cell-line-services',
    'Stable Cell Line Services': 'cell-line-services',
    
    'Lab Supplies': 'uncategorized',
    'Experiment Services': 'uncategorized',
}

for title, category in service_mappings.items():
    try:
        services = ServiceMode.objects.filter(title=title)
        for s in services:
            s.category = category
            s.save()
            print(f"Set category '{category}' for existing service '{title}'")
    except Exception as e:
        print(f"Error updating '{title}': {e}")

# 2. Add missing services
missing_services = [
    {
        'title': 'Gene Tagging Service',
        'url': 'gene-tagging-service',
        'category': 'genome-editing',
        'content': '<h3>Gene Tagging Service</h3><p>Advanced CRISPR-based endogenous gene tagging services to visualize and track proteins inside cells.</p>'
    },
    {
        'title': 'Gene Knockout Service',
        'url': 'gene-knockout-service',
        'category': 'genome-editing',
        'content': '<h3>Gene Knockout Service</h3><p>High-efficiency CRISPR knockouts in a variety of cell lines for functional gene analysis.</p>'
    },
    {
        'title': 'mRNA LNP packaging Service',
        'url': 'mrna-lnp-packaging-service',
        'category': 'ivt-mrna-services',
        'content': '<h3>mRNA LNP packaging Service</h3><p>Custom IVT mRNA synthesis and Lipid Nanoparticle (LNP) encapsulation for robust in vitro and in vivo transfection.</p>'
    }
]

for item in missing_services:
    s, created = ServiceMode.objects.get_or_create(
        url=item['url'],
        defaults={
            'title': item['title'],
            'content': item['content'],
            'category': item['category']
        }
    )
    if created:
        print(f"Created new service: '{item['title']}' under category '{item['category']}'")
    else:
        # Just update category if it already exists
        s.category = item['category']
        s.title = item['title']
        s.save()
        print(f"Updated existing service slug '{item['url']}' with category '{item['category']}'")

print("Services population and categorization finished!")
