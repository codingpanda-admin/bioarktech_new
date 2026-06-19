from rest_framework import serializers
from products.models import *
from genes.models import *


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
    class Meta:
        model = Product
        fields = [
            'product_id', 'external_id', 'product_name', 'description', 'image_url',
            'product_link', 'category_external_id', 'product_group', 'source_type',
            'display_order', 'source_created_at_ms', 'source_created_at',
            'catalog_number', 'availability', 'list_price', 'price_range',
            'quote_only', 'is_featured', 'show_in_featured', 'show_in_gene_editing',
            'key_features', 'options', 'option_prices', 'storage_stability',
            'performance_data', 'data_description', 'manuals', 'manual_urls',
            'images', 'store_link', 'content_text', 'hidden', 'raw_product',
            'raw_override', 'raw_detail', 'created_at', 'updated_at'
        ]

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
    unit_price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['product_name', 'catalog_number', 'unit_price', 'image']
    
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


class ManualFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualFile
        fields = "__all__"


class UnitPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitPrice
        fields = "__all__"
