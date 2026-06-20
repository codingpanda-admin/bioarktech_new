import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection, transaction
from products.models import Product

create_product_table_sql = """
CREATE TABLE IF NOT EXISTS public.product (
    product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_id VARCHAR(100) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    product_link TEXT,
    category_external_id VARCHAR(100),
    product_group VARCHAR(100),
    source_type VARCHAR(50),
    display_order INTEGER,
    source_created_at_ms BIGINT,
    source_created_at TIMESTAMPTZ,
    catalog_number VARCHAR(100),
    availability VARCHAR(100),
    list_price VARCHAR(100),
    price_range VARCHAR(100),
    quote_only BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    show_in_featured BOOLEAN NOT NULL DEFAULT FALSE,
    show_in_gene_editing BOOLEAN NOT NULL DEFAULT FALSE,
    key_features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    option_prices JSONB NOT NULL DEFAULT '{}'::JSONB,
    storage_stability TEXT,
    performance_data TEXT,
    data_description TEXT,
    manuals TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    manual_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    store_link TEXT,
    content_text TEXT,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    raw_product JSONB,
    raw_override JSONB,
    raw_detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_category_external_id ON public.product (category_external_id);
CREATE INDEX IF NOT EXISTS idx_product_display_order ON public.product (display_order);
CREATE INDEX IF NOT EXISTS idx_product_catalog_number ON public.product (catalog_number);
CREATE INDEX IF NOT EXISTS idx_product_show_in_featured ON public.product (show_in_featured) WHERE show_in_featured = TRUE;
"""

def main():
    table_exists = False
    has_records = False
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product');")
        table_exists = cursor.fetchone()[0]
        
    if table_exists:
        try:
            has_records = Product.objects.count() > 0
        except Exception:
            # Column or table mismatch
            has_records = False

    if table_exists and has_records:
        print("Product table already exists and contains data. Skipping initial population.")
        ensure_admin_users()
        return

    sql_path = '/app/db-conversion/populate_product.sql'
    if not os.path.exists(sql_path):
        sql_path = 'db-conversion/populate_product.sql'
        if not os.path.exists(sql_path):
            sql_path = '../db-conversion/populate_product.sql'
            if not os.path.exists(sql_path):
                print("populate_product.sql not found. Skipping population.")
                return

    with open(sql_path, 'r', encoding='utf-8') as f:
        populate_sql = f.read()

    print("Dropping old product tables if they exist in mismatched state...")
    with connection.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS product CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS products CASCADE;")
        
    print("Re-creating product table and indexes...")
    with connection.cursor() as cursor:
        cursor.execute(create_product_table_sql)

    print("Running DML insertions from populate_product.sql...")
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(populate_sql)

    print(f"Product table populated successfully. Total products: {Product.objects.count()}")
    
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
