# coding: utf-8
import os
import sys
import json
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import (
    ProductCategory, Promoter, PromoterSpecialCase, Property, ProteinTag,
    FluoresceneMarker, SelectionMarker, BacterialMarker, BacterialMarkerSpecialCase,
    ProductInventory, StructureType, DeliveryFormat, FunctionType,
    DeliveryLibrary, DesignLibrary, ProductsUnion, FeaturedProduct,
    Image, ManualFile, UnitPrice, Product, Img, ProductImage
)
from interface.models import ProductMode, ServiceMode

json_path = "/app/full_inventory_and_services_export.json"

if not os.path.exists(json_path):
    print(f"Error: JSON file not found at {json_path}")
    sys.exit(1)

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Group items by model
items_by_model = {}
for item in data:
    model_name = item['model']
    if model_name not in items_by_model:
        items_by_model[model_name] = []
    items_by_model[model_name].append(item)

print(f"Loaded {len(data)} items from JSON.")

# Helper to log execution
def import_model_data(model_class, model_key, pk_name, mapper_func):
    items = items_by_model.get(model_key, [])
    print(f"Importing/Updating {len(items)} items for {model_key}...")
    success_count = 0
    for item in items:
        pk = item['pk']
        fields = item['fields'].copy()
        try:
            defaults = mapper_func(pk, fields)
            if defaults is None:
                continue
            model_class.objects.update_or_create(**{pk_name: pk}, defaults=defaults)
            success_count += 1
        except Exception as e:
            print(f"  Error importing PK {pk} of {model_key}: {e}")
    print(f"  Successfully imported {success_count}/{len(items)} items.")

# --- 1. ProductCategory ---
def map_category(pk, fields):
    return {
        'category_name': fields['category_name'],
        'description': fields.get('description'),
        'priority': fields.get('priority', 1)
    }
import_model_data(ProductCategory, 'products.productcategory', 'category_id', map_category)

# --- 2. Promoter ---
import_model_data(Promoter, 'products.promoter', 'promoter_id', lambda pk, f: f)

# --- 3. PromoterSpecialCase ---
import_model_data(PromoterSpecialCase, 'products.promoterspecialcase', 'promoter_id', lambda pk, f: f)

# --- 4. Property ---
import_model_data(Property, 'products.property', 'property_id', lambda pk, f: f)

# --- 5. ProteinTag ---
import_model_data(ProteinTag, 'products.proteintag', 'protein_tag_id', lambda pk, f: f)

# --- 6. FluoresceneMarker ---
import_model_data(FluoresceneMarker, 'products.fluorescenemarker', 'fluorescene_marker_id', lambda pk, f: f)

# --- 7. SelectionMarker ---
import_model_data(SelectionMarker, 'products.selectionmarker', 'selection_marker_id', lambda pk, f: f)

# --- 8. BacterialMarker ---
import_model_data(BacterialMarker, 'products.bacterialmarker', 'bacterial_marker_id', lambda pk, f: f)

# --- 9. BacterialMarkerSpecialCase ---
import_model_data(BacterialMarkerSpecialCase, 'products.bacterialmarkerspecialcase', 'bacterial_marker_id', lambda pk, f: f)

# --- 10. ProductInventory ---
import_model_data(ProductInventory, 'products.productinventory', 'inventory_id', lambda pk, f: f)

# --- 11. StructureType ---
import_model_data(StructureType, 'products.structuretype', 'structure_type_id', lambda pk, f: f)

# --- 12. DeliveryFormat ---
# No primary key defined in models.py for DeliveryFormat, uses default id
import_model_data(DeliveryFormat, 'products.deliveryformat', 'id', lambda pk, f: f)

# --- 13. FunctionType ---
import_model_data(FunctionType, 'products.functiontype', 'function_type_id', lambda pk, f: f)

# --- 14. DeliveryLibrary ---
import_model_data(DeliveryLibrary, 'products.deliverylibrary', 'delivery_library_id', lambda pk, f: f)

# --- 15. DesignLibrary ---
# No primary key defined, uses default id
import_model_data(DesignLibrary, 'products.designlibrary', 'id', lambda pk, f: f)

# --- 16. ProductsUnion ---
import_model_data(ProductsUnion, 'products.productsunion', 'id', lambda pk, f: f)

# --- 17. FeaturedProduct ---
def map_featured(pk, fields):
    union_id = fields.pop('union')
    fields['union_id'] = union_id
    return fields
import_model_data(FeaturedProduct, 'products.featuredproduct', 'id', map_featured)

# --- 18. Image ---
def map_image(pk, fields):
    union_id = fields.pop('union')
    fields['union_id'] = union_id
    return fields
import_model_data(Image, 'products.image', 'id', map_image)

# --- 19. ManualFile ---
def map_manual(pk, fields):
    union_id = fields.pop('union')
    fields['union_id'] = union_id
    return fields
import_model_data(ManualFile, 'products.manualfile', 'id', map_manual)

# --- 20. UnitPrice ---
def map_unitprice(pk, fields):
    union_id = fields.pop('union')
    fields['union_id'] = union_id
    return fields
import_model_data(UnitPrice, 'products.unitprice', 'id', map_unitprice)

# --- 21. ProductMode ---
import_model_data(ProductMode, 'interface.productmode', 'id', lambda pk, f: f)

# --- 22. ServiceMode ---
import_model_data(ServiceMode, 'interface.servicemode', 'id', lambda pk, f: f)

# --- 23. Product (the 24 generic template products) ---
products_to_import = items_by_model.get('products.product', [])
print(f"Importing/Updating {len(products_to_import)} products...")
p_count = 0
for item in products_to_import:
    pk = item['pk']
    fields = item['fields']
    
    sku = fields['product_sku']
    name = fields['product_name']
    
    # Select a coherent image based on product name/type
    if 'CRISPRa' in name or 'CRISPRi' in name or 'CRISPR' in name:
        image_url = '/content-api/uploads/originals/25856f6f-df8b-42cb-8790-08f8091b19eb.png'
    elif 'RNAi' in name or 'shRNA' in name:
        image_url = '/content-api/uploads/originals/c5ac4a80-c1b8-4a65-bfd6-2cff30793e96.png'
    elif 'OverExp' in name:
        image_url = '/content-api/uploads/originals/30248855-528e-46b1-9487-e748b7bbe964.png'
    elif 'Inducible' in name:
        image_url = '/content-api/uploads/originals/fc52e6f9-7ac7-4885-9af4-a371e8b37a37.png'
    else:
        image_url = '/content-api/uploads/originals/30248855-528e-46b1-9487-e748b7bbe964.png'
        
    try:
        # Check if product already exists by external_id or catalog_number
        p_obj = Product.objects.filter(catalog_number=sku).first()
        if not p_obj:
            p_obj = Product.objects.filter(external_id=sku.lower()).first()
            
        defaults = {
            'external_id': sku.lower(),
            'catalog_number': sku,
            'product_name': name,
            'description': fields.get('description') or '',
            'list_price': fields.get('list_price'),
            'availability': 'In Stock' if fields.get('ready_status') == 'Yes' else 'Out of Stock',
            'source_type': 'quote',
            'quote_only': False,
            'show_on_screen': True,
            'hidden': fields.get('ready_status') != 'Yes',
            'raw_product': fields,
            'category_external_id': 'vector-clones',
            'image_url': image_url,
            'images': [image_url],
        }
        
        if p_obj:
            # Update
            for k, v in defaults.items():
                setattr(p_obj, k, v)
            p_obj.save()
        else:
            # Create with specific pk if possible
            # To set specific pk for a new instance, we must explicitly set product_id
            p_obj = Product.objects.create(product_id=pk, **defaults)
            
        p_count += 1
    except Exception as e:
        print(f"  Error importing product '{name}': {e}")

print(f"Successfully imported {p_count}/{len(products_to_import)} products.")
print("All import tasks completed successfully!")
