import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import FeaturedProduct, Image

fp = FeaturedProduct.objects.filter(catalog_number='GN007-2-C').first()
if fp:
    print(f"FeaturedProduct: {fp.product_name}")
    print(f"Union: {fp.union_id}")
    images = Image.objects.filter(union=fp.union)
    print(f"Images count: {images.count()}")
    for img in images:
        print(f"  - Image field value: {repr(img.image.name)}")
        print(f"  - Image url: {repr(img.image.url)}")
        # Check if file exists under the media root using the field path
        media_root = "/var/www/django/media"
        # The file on disk would be at media_root + "/" + image_name
        disk_path_with_folder = os.path.join(media_root, img.image.name)
        disk_path_root = os.path.join(media_root, os.path.basename(img.image.name))
        
        print(f"    * Disk path with folder '{disk_path_with_folder}' exists: {os.path.exists(disk_path_with_folder)}")
        print(f"    * Disk path at root '{disk_path_root}' exists: {os.path.exists(disk_path_root)}")
else:
    print("FeaturedProduct GN007-2-C not found")
