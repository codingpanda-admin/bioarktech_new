import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import ProductCategory

categories_data = [
    {"id": 5, "external_id": "stable-cell-lines", "name": "Cell Lines", "order": 6},
    {"id": 6, "external_id": "genome-editing", "name": "Genome Editing", "order": 1},
    {"id": 7, "external_id": "lentivirus", "name": "Virus Product", "order": 5},
    {"id": 8, "external_id": "vector-clones", "name": "Vector Stock", "order": 2},
    {"id": 9, "external_id": "category-1764975611348", "name": "IVT mRNA", "order": 3},
    {"id": 10, "external_id": "category-1764975769330", "name": "Purified Protein", "order": 4},
    {"id": 11, "external_id": "category-1765063995229", "name": "DNA Reagents", "order": 2},
    {"id": 12, "external_id": "category-1766675337297", "name": "PCR Reagents", "order": 1},
    {"id": 13, "external_id": "category-1765995504911", "name": "Cell Reagents", "order": 5},
    {"id": 14, "external_id": "category-1766675365489", "name": "Protein Reagents", "order": 4},
    {"id": 15, "external_id": "category-1766675380397", "name": "RNA Reagents", "order": 3},
    {"id": 16, "external_id": "category-1780539818236", "name": "Consumables", "order": 6},
    {"id": 17, "external_id": "synthesis-cloning", "name": "Synthesis & Cloning", "order": 2},
    {"id": 18, "external_id": "genome-editing-service", "name": "Genome Editing (Service)", "order": 1},
    {"id": 19, "external_id": "virus-packaging", "name": "Virus Packaging", "order": 5},
    {"id": 20, "external_id": "cell-line-services", "name": "Cell Line Services", "order": 6},
    {"id": 21, "external_id": "category-1764976659245", "name": "Protein Purification", "order": 4},
    {"id": 22, "external_id": "category-1764976735545", "name": "IVT mRNA Services", "order": 3},
    {"id": 23, "external_id": "category-1765830856033", "name": "New Category", "order": 2},
    {"id": 24, "external_id": "category-1765906947802", "name": "New Category2", "order": 3}
]

print("Importing categories...")
created_count = 0
for cat in categories_data:
    existing = ProductCategory.objects.filter(category_id=cat["id"]).first()
    if existing:
        existing.category_name = cat["name"]
        existing.priority = cat["order"]
        existing.external_id = cat["external_id"]
        existing.product_type = "both"
        existing.save()
    else:
        ProductCategory.objects.create(
            category_id=cat["id"],
            category_name=cat["name"],
            priority=cat["order"],
            external_id=cat["external_id"],
            product_type="both"
        )
        created_count += 1

print(f"Categories import complete! Created: {created_count}")
