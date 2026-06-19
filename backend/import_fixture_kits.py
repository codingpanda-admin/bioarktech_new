import os
import django
import json
from django.db.models import Max

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

fixture_path = "/app/products/fixtures/products.json"

with open(fixture_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract products
fixture_products = []
for item in data:
    if item.get("model") == "products.product":
        fixture_products.append(item)

print(f"Loaded {len(fixture_products)} products from fixture.")

# Get next product_id
max_id = Product.objects.aggregate(Max('product_id'))['product_id__max'] or 0
next_id = max_id + 1
print(f"Max existing product_id: {max_id}. New products will start from: {next_id}")

imported_count = 0
updated_count = 0

for item in fixture_products:
    fields = item.get("fields", {})
    sku = fields.get("product_sku")
    name = fields.get("product_name")
    
    # Check if product already exists in public.product table
    existing = Product.objects.filter(external_id=sku).first()
    
    # Map pricing
    unit_price = fields.get("unit_price")
    list_price_val = fields.get("list_price")
    
    list_price_str = f"${unit_price}" if unit_price else ""
    price_range_str = f"${list_price_val}" if list_price_val else ""
    
    # Map other fields
    mapped_fields = {
        "product_name": name,
        "description": fields.get("description") or "",
        "image_url": "/media/product_images/placeholder.svg",
        "product_link": "/products/functional-vectors-kits-template",
        "category_external_id": "gene-editing",
        "product_group": "Gene Editing",
        "source_type": "product",
        "display_order": item.get("pk"),  # use pk to preserve ordering
        "catalog_number": sku,
        "availability": "In Stock" if fields.get("ready_status") == "Yes" else "Out of Stock",
        "list_price": list_price_str,
        "price_range": price_range_str,
        "quote_only": False,
        "is_featured": False,
        "show_in_featured": False,
        "show_in_gene_editing": True,
        "key_features": [],
        "options": [],
        "option_prices": {},
        "storage_stability": fields.get("ship_condition") or "Room Temp",
        "performance_data": "",
        "data_description": "",
        "manuals": [],
        "manual_urls": [],
        "images": [],
        "store_link": "",
        "content_text": "",
        "hidden": False,
        "raw_product": item
    }
    
    if existing:
        # Update existing
        for k, v in mapped_fields.items():
            setattr(existing, k, v)
        existing.save()
        updated_count += 1
    else:
        # Create new
        Product.objects.create(product_id=next_id, external_id=sku, **mapped_fields)
        next_id += 1
        imported_count += 1

print(f"Import complete! Imported: {imported_count} | Updated: {updated_count}")
