import os
import django
from collections import Counter

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, ProductCategory

print(f"Total products in database: {Product.objects.count()}")

# Group by category external id or category object
by_cat = {}
for p in Product.objects.all():
    cat_name = p.category.category_name if p.category else f"None (ext_id: {p.category_external_id})"
    if cat_name not in by_cat:
        by_cat[cat_name] = []
    by_cat[cat_name].append(p)

for cat_name, items in sorted(by_cat.items()):
    print(f"\nCategory: '{cat_name}' ({len(items)} items):")
    # Print sample of first 5 items
    for idx, item in enumerate(items[:5]):
        print(f"  - ID: {item.external_id} | Name: {item.product_name} | Source: {item.source_type}")
    if len(items) > 5:
        print(f"  ... and {len(items) - 5} more")

print("\n--- Summary of Categories Table ---")
for c in ProductCategory.objects.all():
    print(f"Category ID: {c.category_id} | Name: {c.category_name} | Type: {c.product_type} | Ext ID: {c.external_id}")
