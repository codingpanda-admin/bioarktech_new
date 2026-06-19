import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, ProductCategory

# Serializer helpers matching PostgreSQL types
def sql_val_str(val):
    if val is None:
        return "NULL"
    val_str = str(val).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
    return f"E'{val_str}'"

def sql_val_bool(val):
    return "TRUE" if val else "FALSE"

def sql_val_int(val):
    if val is None:
        return "NULL"
    return str(val)

def sql_val_arr(arr):
    if not arr:
        return "ARRAY[]::text[]"
    escaped_items = []
    for item in arr:
        item_str = str(item).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
        escaped_items.append(f"E'{item_str}'")
    return f"ARRAY[{', '.join(escaped_items)}]::text[]"

def sql_val_jsonb(obj):
    if obj is None:
        return "NULL"
    json_str = json.dumps(obj)
    escaped_json = json_str.replace("\\", "\\\\").replace("'", "\\'")
    return f"E'{escaped_json}'::jsonb"

def sql_val_tz(dt):
    if dt is None:
        return "NULL"
    return f"'{dt.isoformat()}'"

# 1. Export Categories
print("Exporting categories from database...")
categories = ProductCategory.objects.all().order_by('category_id')
cat_columns = [
    '"category_id"', '"category_name"', '"description"', '"priority"', '"external_id"', '"product_type"'
]
cat_rows = []
for c in categories:
    fields = [
        sql_val_int(c.category_id),
        sql_val_str(c.category_name),
        sql_val_str(c.description),
        sql_val_int(c.priority),
        sql_val_str(c.external_id),
        sql_val_str(c.product_type)
    ]
    cat_rows.append(f"    ({', '.join(fields)})")

cat_insert_sql = f'INSERT INTO public."product_category" ({", ".join(cat_columns)}) VALUES\n' + ",\n".join(cat_rows) + ";"

# 2. Export Products
print("Exporting products from database...")
products = Product.objects.all().order_by('product_id')
prod_columns = [
    '"product_id"', '"external_id"', '"product_name"', '"description"', '"image_url"', '"product_link"',
    '"category_external_id"', '"product_group"', '"source_type"', '"display_order"', '"source_created_at_ms"',
    '"source_created_at"', '"catalog_number"', '"availability"', '"list_price"', '"price_range"', '"quote_only"',
    '"is_featured"', '"show_in_featured"', '"show_in_gene_editing"', '"key_features"', '"options"', '"option_prices"',
    '"storage_stability"', '"performance_data"', '"data_description"', '"manuals"', '"manual_urls"', '"images"',
    '"store_link"', '"content_text"', '"hidden"', '"raw_product"', '"raw_override"', '"raw_detail"', '"created_at"',
    '"updated_at"'
]
prod_rows = []
for p in products:
    fields = [
        sql_val_int(p.product_id),
        sql_val_str(p.external_id),
        sql_val_str(p.product_name),
        sql_val_str(p.description),
        sql_val_str(p.image_url),
        sql_val_str(p.product_link),
        sql_val_str(p.category_external_id),
        sql_val_str(p.product_group),
        sql_val_str(p.source_type),
        sql_val_int(p.display_order),
        sql_val_int(p.source_created_at_ms),
        sql_val_tz(p.source_created_at),
        sql_val_str(p.catalog_number),
        sql_val_str(p.availability),
        sql_val_str(p.list_price),
        sql_val_str(p.price_range),
        sql_val_bool(p.quote_only),
        sql_val_bool(p.is_featured),
        sql_val_bool(p.show_in_featured),
        sql_val_bool(p.show_in_gene_editing),
        sql_val_arr(p.key_features),
        sql_val_arr(p.options),
        sql_val_jsonb(p.option_prices),
        sql_val_str(p.storage_stability),
        sql_val_str(p.performance_data),
        sql_val_str(p.data_description),
        sql_val_arr(p.manuals),
        sql_val_arr(p.manual_urls),
        sql_val_arr(p.images),
        sql_val_str(p.store_link),
        sql_val_str(p.content_text),
        sql_val_bool(p.hidden),
        sql_val_jsonb(p.raw_product),
        sql_val_jsonb(p.raw_override),
        sql_val_jsonb(p.raw_detail),
        sql_val_tz(p.created_at),
        sql_val_tz(p.updated_at)
    ]
    prod_rows.append(f"    ({', '.join(fields)})")

prod_insert_sql = f'INSERT INTO public."product" ({", ".join(prod_columns)}) VALUES\n' + ",\n".join(prod_rows) + ";"

# Write both to files
with open("/app/category_inserts.sql", "w", encoding="utf-8") as f:
    f.write(cat_insert_sql)

with open("/app/product_inserts.sql", "w", encoding="utf-8") as f:
    f.write(prod_insert_sql)

print(f"Successfully wrote {len(categories)} categories and {len(products)} products to SQL insert files.")
