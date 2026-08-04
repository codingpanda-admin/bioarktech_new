import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from interface.models import ServiceMode
from products.models import Product

print(f"Total services in DB: {ServiceMode.objects.count()}")
for s in ServiceMode.objects.all():
    print(f"Service: {s.title} (slug: {s.url}, category: {s.category})")

print(f"\nTotal products in DB: {Product.objects.count()}")
