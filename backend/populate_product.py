import os
import sys
import django
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def main():
    print("Resetting database to products.json content...")
    from products.models import ProductCategory, Product, Img, ProductImage
    
    # 1. Clear existing products and categories
    ProductImage.objects.all().delete()
    Product.objects.all().delete()
    ProductCategory.objects.all().delete()
    Img.objects.all().delete()
    
    # 2. Locate products.json
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'products.json'),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '../products.json'),
        '/app/products.json',
        'products.json',
    ]
    
    json_path = None
    for path in possible_paths:
        if os.path.exists(path):
            json_path = path
            break
            
    if not json_path:
        print("Error: Could not locate products.json")
        sys.exit(1)
        
    print(f"Loading data from: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    categories_data = data.get("categoriesConfig", {}).get("categories", [])
    products_list = data.get("products", [])
    overrides = data.get("overrides", {})
    details = data.get("details", {})
    groups_config = data.get("groupsConfig", {})
    
    # 3. Create Categories
    created_categories = {}
    for cat in categories_data:
        cat_id = cat['id']
        cat_name = cat['name']
        cat_order = cat.get('order', 1)
        cat_type = cat.get('productType', 'both')
        
        cat_obj, created = ProductCategory.objects.get_or_create(
            external_id=cat_id,
            defaults={
                'category_name': cat_name,
                'priority': cat_order,
                'product_type': cat_type
            }
        )
        created_categories[cat_id] = cat_obj
        action = "Created" if created else "Updated"
        print(f"Category: {cat_name} ({action})")
        
    # 4. Merge and Parse Products
    parsed_products = {}
    
    # - Add from products list
    for p in products_list:
        pid = p["id"]
        parsed_products[pid] = {
            'external_id': pid,
            'catalog_number': pid,
            'product_name': p['name'],
            'description': p.get('description', ''),
            'image_url': p.get('imageUrl', ''),
            'product_link': p.get('link', ''),
            'category_external_id': p.get('category'),
            'product_group': groups_config.get(pid, p.get('groupName')),
            'source_type': p.get('__type', 'quote'),
            'quote_only': p.get('__type') == 'quote',
            'display_order': p.get('order'),
            'source_created_at_ms': p.get('createdAt'),
            'availability': 'In Stock',
            'list_price': 'Contact for Quote',
            'show_on_screen': True,
            'hidden': False,
            'is_featured': False,
            'show_in_featured': False,
            'show_in_gene_editing': False,
            'raw_product': p
        }

    # - Merge/Add from overrides
    for pid, o in overrides.items():
        if pid not in parsed_products:
            parsed_products[pid] = {
                'external_id': pid,
                'catalog_number': pid,
                'product_name': o.get('name', ''),
                'description': o.get('description', ''),
                'image_url': '',
                'product_link': o.get('link', ''),
                'category_external_id': o.get('category'),
                'product_group': groups_config.get(pid, o.get('groupName')),
                'source_type': o.get('__type', 'quote'),
                'quote_only': o.get('__type') == 'quote',
                'display_order': o.get('order'),
                'availability': 'In Stock',
                'list_price': 'Contact for Quote',
                'show_on_screen': True,
                'hidden': False,
                'is_featured': False,
                'show_in_featured': False,
                'show_in_gene_editing': False,
                'raw_override': o
            }
        else:
            p = parsed_products[pid]
            p['product_name'] = o.get('name', p['product_name'])
            p['description'] = o.get('description', p['description'])
            p['product_link'] = o.get('link', p['product_link'])
            p['category_external_id'] = o.get('category', p['category_external_id'])
            p['product_group'] = groups_config.get(pid, p.get('product_group'))
            p['source_type'] = o.get('__type', p['source_type'])
            p['quote_only'] = o.get('__type') == 'quote'
            if 'order' in o:
                p['display_order'] = o['order']
            p['raw_override'] = o

    # - Merge details
    for pid, d in details.items():
        if pid in parsed_products:
            p = parsed_products[pid]
            p.update({
                'catalog_number': d.get('catalogNumber', p.get('catalog_number')),
                'availability': d.get('availability', p.get('availability')),
                'list_price': d.get('listPrice', p.get('list_price')),
                'price_range': d.get('priceRange', ''),
                'quote_only': d.get('quoteOnly', p.get('quote_only')),
                'show_in_featured': d.get('showInFeatured', False),
                'show_in_gene_editing': d.get('showInGeneEditing', False),
                'key_features': d.get('keyFeatures', []),
                'options': d.get('options', []),
                'option_prices': d.get('optionPrices', {}),
                'storage_stability': d.get('storageStability', ''),
                'performance_data': d.get('performanceData', ''),
                'data_description': d.get('dataDescription', ''),
                'manuals': d.get('manuals', []),
                'manual_urls': d.get('manualUrls', []),
                'images': d.get('images', []),
                'store_link': d.get('storeLink', ''),
                'content_text': d.get('contentText', ''),
                'raw_detail': d
            })
            if 'images' in d and d['images']:
                if not p.get('image_url'):
                    p['image_url'] = d['images'][0]
                    
    # 5. Insert Products
    for pid, p in parsed_products.items():
        cat_ext_id = p.get('category_external_id')
        cat_obj = created_categories.get(cat_ext_id)
        
        prod_obj, created = Product.objects.get_or_create(
            external_id=p['external_id'],
            defaults={
                'catalog_number': p['catalog_number'],
                'product_name': p['product_name'],
                'description': p['description'],
                'image_url': p['image_url'],
                'product_link': p['product_link'],
                'category_external_id': p['category_external_id'],
                'category': cat_obj,
                'product_group': p.get('product_group'),
                'source_type': p['source_type'],
                'display_order': p.get('display_order'),
                'source_created_at_ms': p.get('source_created_at_ms'),
                'availability': p['availability'],
                'list_price': p['list_price'],
                'price_range': p['price_range'],
                'quote_only': p['quote_only'],
                'show_on_screen': p['show_on_screen'],
                'is_featured': p['show_in_featured'],
                'show_in_featured': p['show_in_featured'],
                'show_in_gene_editing': p['show_in_gene_editing'],
                'key_features': p['key_features'],
                'options': p['options'],
                'option_prices': p['option_prices'],
                'storage_stability': p['storage_stability'],
                'performance_data': p['performance_data'],
                'data_description': p['data_description'],
                'manuals': p['manuals'],
                'manual_urls': p['manual_urls'],
                'images': p['images'],
                'store_link': p['store_link'],
                'content_text': p['content_text'],
                'hidden': p['hidden'],
                'raw_product': p.get('raw_product'),
                'raw_override': p.get('raw_override'),
                'raw_detail': p.get('raw_detail')
            }
        )
        action = "Created" if created else "Updated"
        print(f"Product: {prod_obj.product_name} ({action})")
        
        # Sync images manually
        image_paths = []
        if prod_obj.image_url:
            image_paths.append(prod_obj.image_url)
        if prod_obj.images:
            for img_path in prod_obj.images:
                if img_path and img_path not in image_paths:
                    image_paths.append(img_path)

        for path in image_paths:
            if not path:
                continue
            img_obj, _ = Img.objects.get_or_create(image_path=path)
            ProductImage.objects.get_or_create(product=prod_obj, img=img_obj)
            
    print(f"Successfully populated {len(parsed_products)} products.")
    ensure_admin_users()


def ensure_admin_users():
    from users.models import User
    admin_emails = ['conding.panda@gmail.com', 'coding.panda@gmail.com']
    for email in admin_emails:
        try:
            u, created = User.objects.get_or_create(email=email)
            u.set_password('admin1234')
            u.is_admin = True
            u.is_staff = True
            u.is_superuser = True
            u.save()
            action = "Created" if created else "Updated"
            print(f"Admin user {email} {action} successfully with password 'admin1234'.")
        except Exception as e:
            print(f"Failed to ensure admin user {email}: {e}")

if __name__ == '__main__':
    main()
