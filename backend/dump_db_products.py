# coding: utf-8
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

products = Product.objects.all()

with open("/app/db_products_list.txt", "w", encoding="utf-8") as out:
    out.write(f"Total products in DB: {products.count()}\n")
    for p in products:
        out.write(f"ID: {p.product_id} | ExtID: {p.external_id} | Catalog: {p.catalog_number} | Name: {p.product_name} | Source: {p.source_type}\n")
print("Done writing DB products list.")
