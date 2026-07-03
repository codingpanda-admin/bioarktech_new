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
    category_id INTEGER REFERENCES product_category(category_id) ON DELETE SET NULL,
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
        populate_mock_products_and_images()
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
    
    populate_mock_products_and_images()
    ensure_admin_users()


MOCK_PRODUCTS = [
    {
        'product_name': 'Cas9 Nuclease (S. pyogenes) Recombinant',
        'catalog_number': 'CAS-001',
        'external_id': 'cas9-nuclease-recombinant',
        'description': 'High-purity recombinant Cas9 protein from S. pyogenes, containing a nuclear localization signal (NLS) for efficient genome editing.',
        'availability': 'In Stock',
        'list_price': 'Contact for Quote',
        'category_external_id': 'category-1764975769330',
        'product_group': 'Purified Proteins',
        'key_features': ['High-purity recombinant protein', 'NLS-tagged for nuclear import', 'Active in vitro and in vivo'],
        'options': [],
        'option_prices': {},
        'storage_stability': 'Store at -20°C',
        'performance_data': 'Highly active in gene knockout and knock-in validation assays.',
        'manuals': [],
        'manual_urls': [],
        'images': [],
    },
    {
        'product_name': 'Lentivirus ORF Stock',
        'catalog_number': 'LV-ORF',
        'external_id': 'lentivirus-orf-stock',
        'description': 'Ready-to-use lentivirus particles containing human/mouse/rat ORFs for stable expression.',
        'availability': 'In Stock',
        'list_price': 'Contact for Quote',
        'category_external_id': 'lentivirus',
        'product_group': 'Lentivirus Products',
        'key_features': ['High titer (>10^8 TU/mL)', 'Stable integration', 'Wide host range'],
        'options': [],
        'option_prices': {},
        'storage_stability': 'Store at -80°C',
        'performance_data': 'Transduction validation in HeLa cells shows high expression levels.',
        'manuals': [],
        'manual_urls': [],
        'images': [],
    },
    {
        'product_name': 'Lentivirus Control Stock',
        'catalog_number': 'LV-CTR',
        'external_id': 'lentivirus-control-stock',
        'description': 'Negative and positive control lentivirus particles (e.g. GFP, RFP, Null) for transduction optimization.',
        'availability': 'In Stock',
        'list_price': 'Contact for Quote',
        'category_external_id': 'lentivirus',
        'product_group': 'Lentivirus Products',
        'key_features': ['Control transduction validator', 'High quality QC validated', 'Available with fluorescence markers'],
        'options': [],
        'option_prices': {},
        'storage_stability': 'Store at -80°C',
        'performance_data': 'High-titer control for assay optimization.',
        'manuals': [],
        'manual_urls': [],
        'images': [],
    },
    {
        'product_name': 'Stable Cell Line Stock',
        'catalog_number': 'SCL-001',
        'external_id': 'stable-cell-line-stock',
        'description': 'Pre-made stable cell lines expressing popular reporters, checkpoints, or target genes.',
        'availability': 'In Stock',
        'list_price': 'Contact for Quote',
        'category_external_id': 'stable-cell-lines',
        'product_group': 'Stable Cell Lines',
        'key_features': ['Clonally isolated', 'High stability across passages', 'Mycoplasma free'],
        'options': [],
        'option_prices': {},
        'storage_stability': 'Liquid nitrogen storage',
        'performance_data': 'Validated for marker expression and proliferation rates.',
        'manuals': [],
        'manual_urls': [],
        'images': [],
    },
    {
        'product_name': 'CleanCap® FLuc mRNA',
        'catalog_number': 'mRNA-001',
        'external_id': 'cleancap-fluc-mrna',
        'description': 'CleanCap-capped Firefly Luciferase mRNA for validation of translation and transfection efficiency in mammalian cells.',
        'availability': 'In Stock',
        'list_price': 'Contact for Quote',
        'category_external_id': 'category-1764975611348',
        'product_group': 'IVT mRNA',
        'key_features': ['Capped with CleanCap® AG', '99% purity by HPLC', 'Polyadenylated for stability'],
        'options': [],
        'option_prices': {},
        'storage_stability': 'Store at -80°C',
        'performance_data': 'HPLC chromatography showing single peak purity.',
        'manuals': [],
        'manual_urls': [],
        'images': [],
    },
    {
        'product_name': 'CleanCap® EGFP mRNA',
        'catalog_number': 'mRNA-002',
        'external_id': 'cleancap-egfp-mrna',
        'description': 'CleanCap-capped Enhanced Green Fluorescent Protein mRNA for easy visualization of transfection efficiency.',
        'availability': 'In Stock',
        'list_price': 'Contact for Quote',
        'category_external_id': 'category-1764975611348',
        'product_group': 'IVT mRNA',
        'key_features': ['High-expression GFP construct', 'HPLC purified', 'Safe non-viral transfection'],
        'options': [],
        'option_prices': {},
        'storage_stability': 'Store at -80°C',
        'performance_data': 'Transfection validation shows GFP expression in over 90% of cells.',
        'manuals': [],
        'manual_urls': [],
        'images': [],
    }
]


DEFAULT_PRODUCT_CATEGORIES = [
    # Products
    {'category_name': 'Genome Editing', 'external_id': 'genome-editing', 'product_type': 'product'},
    {'category_name': 'Vector Stock', 'external_id': 'vector-clones', 'product_type': 'product'},
    {'category_name': 'IVT mRNA', 'external_id': 'category-1764975611348', 'product_type': 'product'},
    {'category_name': 'Purified Protein', 'external_id': 'category-1764975769330', 'product_type': 'product'},
    {'category_name': 'Virus Product', 'external_id': 'lentivirus', 'product_type': 'product'},
    {'category_name': 'Cell Lines', 'external_id': 'stable-cell-lines', 'product_type': 'product'},

    # Services
    {'category_name': 'Genome Editing Services', 'external_id': 'genome-editing-services', 'product_type': 'service'},
    {'category_name': 'Custom Cloning Services', 'external_id': 'synthesis-cloning-services', 'product_type': 'service'},
    {'category_name': 'Stable Cell Line Services', 'external_id': 'cell-line-services', 'product_type': 'service'},
    {'category_name': 'Lentivirus Package Services', 'external_id': 'virus-packaging-services', 'product_type': 'service'},
    {'category_name': 'Vector Construction Support', 'external_id': 'vector-construction-services', 'product_type': 'service'},
    {'category_name': 'Functional Testing', 'external_id': 'functional-testing-services', 'product_type': 'service'},
    {'category_name': 'Experiment Services', 'external_id': 'experiment-services', 'product_type': 'service'},
    {'category_name': 'Lab Supplies', 'external_id': 'lab-supplies-services', 'product_type': 'service'},
    {'category_name': 'Project Consultation', 'external_id': 'project-consultation-services', 'product_type': 'service'},
    {'category_name': 'Protein Purification', 'external_id': 'protein-purification-services', 'product_type': 'service'},

    # Reagents
    {'category_name': 'DNA Reagents', 'external_id': 'category-1765063995229', 'product_type': 'reagent'},
    {'category_name': 'RNA Reagents', 'external_id': 'category-1766675380397', 'product_type': 'reagent'},
    {'category_name': 'Protein Reagents', 'external_id': 'category-1766675365489', 'product_type': 'reagent'},
    {'category_name': 'Cell Reagents', 'external_id': 'category-1765995504911', 'product_type': 'reagent'},

    # Consumables
    {'category_name': 'Consumables', 'external_id': 'category-1780539818236', 'product_type': 'consumable'},
]


def populate_mock_products_and_images():
    from products.models import ProductCategory, Product, Img, ProductImage, Image

    if ProductCategory.objects.exists():
        print("Categories already populated. Skipping category population.")
    else:
        print("Populating categories into the database...")
        for item in DEFAULT_PRODUCT_CATEGORIES:
            cat_obj, created = ProductCategory.objects.get_or_create(
                category_name=item['category_name'],
                defaults={
                    'external_id': item['external_id'],
                    'product_type': item['product_type']
                }
            )
            print(f"Ensured category: {cat_obj.category_name}")

    if Product.objects.filter(source_type='mock').exists():
        print("Mock products already populated. Skipping mock products population.")
    else:
        print("Populating mock products into the database...")
        for item in MOCK_PRODUCTS:
            p, created = Product.objects.get_or_create(
                external_id=item['external_id'],
                defaults={
                    'product_name': item['product_name'],
                    'catalog_number': item['catalog_number'],
                    'description': item['description'],
                    'availability': item['availability'],
                    'list_price': item['list_price'],
                    'category_external_id': item['category_external_id'],
                    'product_group': item['product_group'],
                    'key_features': item['key_features'],
                    'options': item['options'],
                    'option_prices': item['option_prices'],
                    'storage_stability': item['storage_stability'],
                    'performance_data': item['performance_data'],
                    'manuals': item['manuals'],
                    'manual_urls': item['manual_urls'],
                    'images': item['images'],
                    'source_type': 'mock'
                }
            )
            print(f"Ensured mock product: {p.product_name}")

    if ProductImage.objects.exists():
        print("Product image relations already populated. Skipping image migration.")
    else:
        print("Migrating product images to relational tables (img and product_images)...")
        for product in Product.objects.all():
            image_paths = []
            if product.image_url:
                image_paths.append(product.image_url)
            if product.images:
                for img_path in product.images:
                    if img_path and img_path not in image_paths:
                        image_paths.append(img_path)

            for path in image_paths:
                if not path:
                    continue
                img_obj, _ = Img.objects.get_or_create(image_path=path)
                ProductImage.objects.get_or_create(product=product, img=img_obj)

        print("Migrating featured product/Image model records to relational tables...")
        for image in Image.objects.all():
            if not image.image or not image.image.name:
                continue
            path = f"/media/{image.image.name}"
            if image.union and image.union.product_id:
                products = Product.objects.filter(catalog_number=image.union.product_id)
                for product in products:
                    img_obj, _ = Img.objects.get_or_create(image_path=path)
                    ProductImage.objects.get_or_create(product=product, img=img_obj)
        print("Relational images population finished successfully!")

    if Product.objects.filter(category__isnull=False).exists():
        print("Category relationships already linked. Skipping linkage.")
    else:
        print("Linking products to their categories in the database...")
        for product in Product.objects.all():
            if product.category_external_id:
                cat_obj = ProductCategory.objects.filter(external_id=product.category_external_id).first()
                if cat_obj:
                    product.category = cat_obj
                    product.save()
        print("Category relationships synced successfully!")


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
