from rest_framework import serializers
from products.models import *
from genes.models import *

DEFAULT_CATEGORY_LABELS = {
    'genome-editing': 'Genome Editing',
    'vector-clones': 'Vector Stock',
    'category-1764975611348': 'IVT mRNA',
    'category-1764975769330': 'Purified Protein',
    'lentivirus': 'Virus Product',
    'stable-cell-lines': 'Cell Lines',
    'genome-editing-services': 'Genome Editing Services',
    'synthesis-cloning-services': 'Custom Cloning Services',
    'cell-line-services': 'Stable Cell Line Services',
    'virus-packaging-services': 'Lentivirus Package Services',
    'vector-construction-services': 'Vector Construction Support',
    'functional-testing-services': 'Functional Testing',
    'experiment-services': 'Experiment Services',
    'lab-supplies-services': 'Lab Supplies',
    'project-consultation-services': 'Project Consultation',
    'category-1765063995229': 'DNA Reagents',
    'category-1766675380397': 'RNA Reagents',
    'category-1766675365489': 'Protein Reagents',
    'category-1765995504911': 'Cell Reagents',
    'category-1780539818236': 'Consumables',
}


def get_product_category_name(product):
    if hasattr(product, 'category') and product.category:
        return product.category.category_name
    category_external_id = getattr(product, 'category_external_id', None)
    if not category_external_id:
        return None

    category = ProductCategory.objects.filter(external_id=category_external_id).first()
    if category:
        return category.category_name

    return DEFAULT_CATEGORY_LABELS.get(category_external_id, category_external_id)


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = [
            'category_id', 'category_name', 'description', 'priority',
            'external_id', 'product_type', 'show_on_homepage', 'homepage_image',
        ]

class FunctionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FunctionType
        fields = ['function_type_id', 'function_type_symbol', 'function_type_name', 'description']

class DeliveryLibrarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryLibrary
        fields = ['delivery_type_symbol', 'delivery_type_name', 'delivery_format_symbol', 'delivery_format_name']

class GeneLibrarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneLibrary
        fields = ['target_sequence', 'symbol', 'gene_name', 'locus_id']

class DeliveryFormatTableSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return {
            'delivery_format_name': DeliveryFormat.objects.get(delivery_format_symbol=instance.delivery_format_code).delivery_format_name,
            'product_format_description': DeliveryFormat.objects.get(delivery_format_symbol=instance.delivery_format_code).description,
            'product_name': "Test",
            'quantity': instance.amount + " " + instance.unit_size,
            'price': instance.base_price,
        }

class ProductSerializer(serializers.ModelSerializer):
    externalId = serializers.CharField(source='external_id', read_only=True)
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'product_id', 'external_id', 'externalId', 'product_name', 'description', 'image_url',
            'product_link', 'category_external_id', 'product_group', 'source_type',
            'display_order', 'source_created_at_ms', 'source_created_at',
            'catalog_number', 'availability', 'list_price', 'discounted_price', 'price_range',
            'quote_only', 'is_featured', 'show_on_screen', 'show_in_featured', 'show_in_gene_editing',
            'key_features', 'options', 'option_prices', 'option_discounted_prices', 'storage_stability',
            'performance_data', 'data_description', 'manuals', 'manual_urls',
            'images', 'videos', 'store_link', 'content_text', 'hidden', 'raw_product', 'category_name',
            'raw_override', 'raw_detail', 'created_at', 'updated_at'
        ]

    def get_category_name(self, product):
        return get_product_category_name(product)

class FeaturedProductSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    manuals = serializers.SerializerMethodField()
    unit_prices = serializers.SerializerMethodField()

    class Meta:
        model = FeaturedProduct
        fields = ['product_name', 'catalog_number', 'description', 'key_features', 'performance_data', 'storage_info', 'ship_info', 'images', 'manuals', 'unit_prices']
    
    def get_images(self, product):
        images = Image.objects.filter(union=product.union)
        serializer = ImageSerializer(images, many=True)
        return serializer.data
    
    def get_manuals(self, product):
        manuals = ManualFile.objects.filter(union=product.union)
        serializer = ManualFileSerializer(manuals, many=True)
        return serializer.data
    
    def get_unit_prices(self, product):
        unit_prices = UnitPrice.objects.filter(union=product.union)
        serializer = UnitPriceSerializer(unit_prices, many=True)
        return serializer.data


class PreviewFeaturedProductSerializer(serializers.ModelSerializer):
    externalId = serializers.CharField(source='external_id', read_only=True)
    unit_price = serializers.SerializerMethodField()
    first_option_price = serializers.SerializerMethodField()
    first_option_discounted_price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    catalog_number = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'product_name', 'external_id', 'externalId', 'catalog_number', 'unit_price',
            'list_price', 'discounted_price', 'options', 'option_prices',
            'option_discounted_prices', 'first_option_price',
            'first_option_discounted_price', 'image',
            'show_on_screen',
        ]

    def get_product_name(self, product):
        return product.product_name

    def get_catalog_number(self, product):
        if product.external_id and product.external_id.startswith('fp-'):
            return product.external_id[3:].upper()
        return product.catalog_number
    
    def get_unit_price(self, product):
        if product.external_id and product.external_id.startswith('fp-'):
            cat_num = product.external_id[3:].upper()
            fp = FeaturedProduct.objects.filter(catalog_number__iexact=cat_num).first()
            if fp:
                prices = UnitPrice.objects.filter(union=fp.union).order_by('unit_price')
                if prices.exists():
                    p_min = prices.first().unit_price
                    p_max = prices.last().unit_price
                    if p_min == p_max:
                        return f"${p_min:.0f}" if p_min % 1 == 0 else f"${p_min:.2f}"
                    min_str = f"${p_min:.0f}" if p_min % 1 == 0 else f"${p_min:.2f}"
                    max_str = f"${p_max:.0f}" if p_max % 1 == 0 else f"${p_max:.2f}"
                    return f"{min_str} - {max_str}"
                return fp.on_discount
        return product.list_price or product.price_range

    def get_first_option_price(self, product):
        options = product.options if isinstance(product.options, list) else []
        option_prices = product.option_prices if isinstance(product.option_prices, dict) else {}

        if options:
            first_option = str(options[0] or '').strip()
            first_price = option_prices.get(first_option)
            if first_price not in [None, '']:
                return first_price

        for option_price in option_prices.values():
            if option_price not in [None, '']:
                return option_price

        featured_product = None
        if product.external_id and product.external_id.startswith('fp-'):
            featured_product = FeaturedProduct.objects.filter(
                catalog_number__iexact=product.external_id[3:].upper()
            ).first()
        elif product.catalog_number:
            featured_product = FeaturedProduct.objects.filter(
                catalog_number__iexact=product.catalog_number
            ).first()

        if featured_product:
            unit_price = UnitPrice.objects.filter(union=featured_product.union).order_by('id').first()
            if unit_price:
                return unit_price.unit_price

        return ''

    def get_first_option_discounted_price(self, product):
        options = product.options if isinstance(product.options, list) else []
        option_discounts = (
            product.option_discounted_prices
            if isinstance(product.option_discounted_prices, dict)
            else {}
        )

        if options:
            first_option = str(options[0] or '').strip()
            first_discount = option_discounts.get(first_option)
            if first_discount not in [None, '']:
                return first_discount

        return next(
            (price for price in option_discounts.values() if price not in [None, '']),
            '',
        )

    def get_image(self, product):
        fp = None
        if product.external_id and product.external_id.startswith('fp-'):
            cat_num = product.external_id[3:].upper()
            fp = FeaturedProduct.objects.filter(catalog_number__iexact=cat_num).first()
        elif product.catalog_number:
            fp = FeaturedProduct.objects.filter(catalog_number__iexact=product.catalog_number).first()

        if fp:
            img = Image.objects.filter(union=fp.union, main_display=True).first()
            if not img:
                img = Image.objects.filter(union=fp.union).first()
            if img and img.image:
                import os
                from django.conf import settings
                filename = os.path.basename(img.image.name)
                subfolder_path = os.path.join(settings.MEDIA_ROOT, 'product_images', filename)
                if os.path.exists(subfolder_path):
                    return f"/media/product_images/{filename}"
                return f"/media/{filename}"
        if product.image_url:
            return product.image_url
        return product.images[0] if product.images else None



class ImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Image
        fields = "__all__"

    def get_image(self, obj):
        if not obj.image:
            return None
        import os
        from django.conf import settings
        filename = os.path.basename(obj.image.name)
        subfolder_path = os.path.join(settings.MEDIA_ROOT, 'product_images', filename)
        if os.path.exists(subfolder_path):
            return f"/media/product_images/{filename}"
        return f"/media/{filename}"


class ImgSerializer(serializers.ModelSerializer):
    class Meta:
        model = Img
        fields = "__all__"


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = "__all__"


class ManualFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualFile
        fields = "__all__"


class UnitPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitPrice
        fields = "__all__"
