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
        s.category = item['category']
        s.title = item['title']
        s.save()
        print(f"Updated existing service slug '{item['url']}' with category '{item['category']}'")

# 3. Add homepage slides
print("Populating homepage slides...")
from interface.models import HomepageSlide

slides = [
    {
        'id': 1,
        'eyebrow': 'Genetic Innovation',
        'title': 'Innovative Seed on Board',
        'description': 'Your trusted CRO partner for advanced gene editing and delivery solutions, accelerating research from discovery to therapy.',
        'primary_button_text': 'Explore Services',
        'primary_button_link': '/services',
        'secondary_button_text': 'Request a Quote',
        'secondary_button_link': '/request-quote',
        'image_url': '/images/homepage/hero-background-new.jpg',
        'display_order': 1,
        'is_active': True
    },
    {
        'id': 2,
        'eyebrow': 'Limited Offer',
        'title': '50% Off Precast Agarose Gels',
        'description': 'High-resolution, ready-to-use gels for fast and reliable DNA analysis. In-stock and ready to ship.',
        'primary_button_text': 'Shop Now',
        'primary_button_link': '/search?q=Agarose',
        'secondary_button_text': 'Request a Quote',
        'secondary_button_link': '/request-quote',
        'image_url': '/images/homepage/Homepage-1.jpg',
        'display_order': 2,
        'is_active': True
    },
    {
        'id': 3,
        'eyebrow': 'Advanced Virus Packaging',
        'title': 'High-Titer Lentivirus Stocks',
        'description': 'Ready-to-use lentivirus particles containing ORF stocks for stable and high-efficiency gene expression.',
        'primary_button_text': 'View Reagents',
        'primary_button_link': '/search?q=Lentivirus',
        'secondary_button_text': 'Contact Expert',
        'secondary_button_link': '/request-quote',
        'image_url': '/images/homepage/Homepage-2.jpg',
        'display_order': 3,
        'is_active': True
    },
    {
        'id': 4,
        'eyebrow': 'Cell Line Engineering',
        'title': 'Pre-made Stable Cell Lines',
        'description': 'Clonally isolated, mycoplasma-free stable cell lines expressing popular reporters and checkpoints.',
        'primary_button_text': 'Explore Lines',
        'primary_button_link': '/search?q=Cell',
        'secondary_button_text': 'Request a Quote',
        'secondary_button_link': '/request-quote',
        'image_url': '/images/homepage/Homepage-3.jpg',
        'display_order': 4,
        'is_active': True
    }
]

for slide_data in slides:
    slide_id = slide_data['id']
    s, created = HomepageSlide.objects.update_or_create(
        id=slide_id,
        defaults={
            'eyebrow': slide_data['eyebrow'],
            'title': slide_data['title'],
            'description': slide_data['description'],
            'primary_button_text': slide_data['primary_button_text'],
            'primary_button_link': slide_data['primary_button_link'],
            'secondary_button_text': slide_data['secondary_button_text'],
            'secondary_button_link': slide_data['secondary_button_link'],
            'image_url': slide_data['image_url'],
            'display_order': slide_data['display_order'],
            'is_active': slide_data['is_active']
        }
    )
    if created:
        print(f"Created homepage slide: '{s.title}'")
    else:
        print(f"Updated homepage slide: '{s.title}'")

print("Services and Homepage slides population finished!")

