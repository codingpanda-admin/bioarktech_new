import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

none_cat_products = Product.objects.filter(category__isnull=True)
print(f"Total None-category products: {none_cat_products.count()}")
for idx, p in enumerate(none_cat_products):
    print(f"{idx+1}. ID: {p.external_id} | Name: {p.product_name} | Group: {p.product_group} | CatExt: {p.category_external_id} | Source: {p.source_type}")
