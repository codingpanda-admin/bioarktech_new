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
        fields = ['category_id', 'category_name', 'description', 'priority', 'external_id', 'product_type']

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
            'catalog_number', 'availability', 'list_price', 'price_range',
            'quote_only', 'is_featured', 'show_in_featured', 'show_in_gene_editing',
            'key_features', 'options', 'option_prices', 'storage_stability',
            'performance_data', 'data_description', 'manuals', 'manual_urls',
            'images', 'store_link', 'content_text', 'hidden', 'raw_product', 'category_name',
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
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['product_name', 'external_id', 'externalId', 'catalog_number', 'unit_price', 'image']
    
    def get_unit_price(self, product):
        return product.list_price or product.price_range

    def get_image(self, product):
        if product.image_url:
            return product.image_url
        return product.images[0] if product.images else None


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = "__all__"


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
