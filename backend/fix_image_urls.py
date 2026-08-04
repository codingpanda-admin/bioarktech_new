import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

# Media path inside the container:
MEDIA_DIR = '/var/www/django/media'

print("Starting to fix product image URLs...")

updated_count = 0
not_found_count = 0
already_correct = 0

for p in Product.objects.all():
    url = p.image_url
    if not url:
        continue
        
    orig_url = url
    
    # Keep placeholder
    if 'placeholder.svg' in url:
        continue
        
    filename = os.path.basename(url)
    
    # Clean up standard suffix if present (like -300x300)
    clean_filename = filename
    if '-300x300' in filename:
        clean_filename = filename.replace('-300x300', '')
        
    # Check paths inside media directory
    path_options = [
        (os.path.join(MEDIA_DIR, filename), filename),
        (os.path.join(MEDIA_DIR, clean_filename), clean_filename),
        (os.path.join(MEDIA_DIR, 'product_images', filename), f"product_images/{filename}"),
        (os.path.join(MEDIA_DIR, 'product_images', clean_filename), f"product_images/{clean_filename}")
    ]
    
    found_rel_path = None
    for full_path, rel_path in path_options:
        if os.path.exists(full_path):
            found_rel_path = rel_path
            break
            
    if found_rel_path:
        new_url = f"/media/{found_rel_path}"
        if orig_url != new_url:
            p.image_url = new_url
            p.save()
            print(f"Updated '{p.product_name}': '{orig_url}' -> '{new_url}'")
            updated_count += 1
        else:
            already_correct += 1
    else:
        print(f"WARNING: Image file for '{p.product_name}' ('{filename}' / '{clean_filename}') NOT found.")
        not_found_count += 1

print(f"\nSummary:\n- Updated: {updated_count}\n- Already correct: {already_correct}\n- Not found: {not_found_count}")
