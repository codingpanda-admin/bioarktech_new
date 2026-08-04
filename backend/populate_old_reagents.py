import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

path_reagents = "/app/reagents.json"
with open(path_reagents, "r", encoding="utf-8") as f:
    data = json.load(f)

reagents = data.get("reagents", [])
details = data.get("details", {})

print(f"Loaded {len(reagents)} reagents from JSON.")

created_count = 0
updated_count = 0

for r in reagents:
    rid = r.get("id")
    rname = r.get("name")
    rcat = r.get("category")
    rgroup = r.get("groupName")
    desc = r.get("description")
    
    # Get details
    detail = details.get(rid, {})
    catalog = detail.get("catalogNumber", "N/A")
    list_price = detail.get("listPrice", "Contact for Quote")
    availability = detail.get("availability", "In Stock")
    options = detail.get("options", [])
    option_prices = detail.get("optionPrices", {})
    key_features = detail.get("keyFeatures", [])
    storage_stability = detail.get("storageStability", "")
    performance_data = detail.get("performanceData", "")
    manuals = detail.get("manuals", [])
    manual_urls = detail.get("manualUrls", [])
    store_link = detail.get("storeLink", "")
    
    # Get or create Product
    p, created = Product.objects.get_or_create(
        external_id=rid,
        defaults={
            'product_name': rname,
            'catalog_number': catalog,
            'category_external_id': rcat,
            'product_group': rgroup,
            'description': desc,
            'list_price': list_price,
            'availability': availability,
            'options': options,
            'option_prices': option_prices,
            'key_features': key_features,
            'storage_stability': storage_stability,
            'performance_data': performance_data,
            'manuals': manuals,
            'manual_urls': manual_urls,
            'store_link': store_link,
            'source_type': 'reagent',
            'image_url': '/placeholder.svg'
        }
    )
    
    if created:
        created_count += 1
        print(f"Created: '{rname}' [Cat: {catalog}]")
    else:
        # Update fields to ensure they align
        p.product_name = rname
        p.catalog_number = catalog
        p.category_external_id = rcat
        p.product_group = rgroup
        p.description = desc
        p.list_price = list_price
        p.availability = availability
        p.options = options
        p.option_prices = option_prices
        p.key_features = key_features
        p.storage_stability = storage_stability
        p.performance_data = performance_data
        p.manuals = manuals
        p.manual_urls = manual_urls
        p.store_link = store_link
        p.source_type = 'reagent'
        p.save()
        updated_count += 1
        print(f"Updated: '{rname}'")

print(f"\nPopulation finished! Created {created_count} products, updated {updated_count} products.")
