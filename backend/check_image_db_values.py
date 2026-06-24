import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, FeaturedProduct, Img, Image

queries = [
    "be750c48-4a70-49ee-8a08-197239a7650f.jpg",
    "a38f62d2-774d-41fd-885e-ef93a6d79cec.webp"
]

for q in queries:
    print(f"\n--- Searching DB for: '{q}' ---")
    
    # 1. Search in Product image_url
    prods_url = Product.objects.filter(image_url__icontains=q)
    print(f"Product.image_url matches ({prods_url.count()}):")
    for p in prods_url:
        print(f"  - Product ID: {p.product_id}, Name: '{p.product_name}', URL: '{p.image_url}'")
        
    # 2. Search in Product images array
    prods_arr = Product.objects.filter(images__icontains=q)
    print(f"Product.images matches ({prods_arr.count()}):")
    for p in prods_arr:
        print(f"  - Product ID: {p.product_id}, Name: '{p.product_name}', Images: {p.images}")
        
    # 3. Search in Img
    imgs = Img.objects.filter(image_path__icontains=q)
    print(f"Img.image_path matches ({imgs.count()}):")
    for img in imgs:
        print(f"  - Img ID: {img.id}, Path: '{img.image_path}'")
        
    # 4. Search in Image
    images = Image.objects.filter(image__icontains=q)
    print(f"Image.image (FeaturedProduct related) matches ({images.count()}):")
    for img in images:
        print(f"  - Image ID: {img.id}, File: '{img.image}', URL: '{img.image.url}'")
        # Try to find corresponding FeaturedProduct
        fp = FeaturedProduct.objects.filter(union=img.union).first()
        if fp:
            print(f"    * Linked FeaturedProduct: '{fp.product_name}' (Catalog: {fp.catalog_number})")
