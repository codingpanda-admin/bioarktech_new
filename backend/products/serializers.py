from rest_framework import serializers
from products.models import *
from genes.models import *


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['category_id', 'category_name', 'description']

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
    function_type_name = serializers.SerializerMethodField()
    structure_type_name = serializers.SerializerMethodField()
    delivery_type_name = serializers.SerializerMethodField()
    promoter_name = serializers.SerializerMethodField()
    protein_tag_name = serializers.SerializerMethodField()
    fluorescene_marker_name = serializers.SerializerMethodField()
    selection_marker_name = serializers.SerializerMethodField()
    bacterial_marker_name = serializers.SerializerMethodField()
    delivery_format_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['product_id', 'product_sku', 'product_name', 'description', 'function_type_name', 'structure_type_name', 'delivery_type_name', 'promoter_name', 'protein_tag_name', 'fluorescene_marker_name', 'selection_marker_name', 'bacterial_marker_name', 'delivery_format_name', 'target_sequence', 'unit_price', 'list_price']
    
    def get_function_type_name(self, product):
        try:
            function_type = FunctionType.objects.filter(function_type_symbol=product.function_type_code).first()
            return function_type.function_type_name
        except Exception:
            return None
    
    def get_structure_type_name(self, product):
        try:
            structure_type = StructureType.objects.filter(structure_type_symbol=product.structure_type_code).first()
            return structure_type.structure_type_name
        except Exception:
            return None

    def get_delivery_type_name(self, product):
        try:
            delivery_type = DeliveryLibrary.objects.filter(delivery_type_symbol=product.delivery_type_code).first()
            return delivery_type.delivery_type_name
        except Exception:
            return None
    
    def get_promoter_name(self, product):
        try:
            promoter_queryset = Promoter.objects.filter(promoter_code=product.promoter_code).values("promoter_name")
            promoter_special_case_queryset = PromoterSpecialCase.objects.filter(promoter_code=product.promoter_code).values("promoter_name")
            promoter = promoter_queryset.union(promoter_special_case_queryset)[0]
            return promoter['promoter_name']
        except Exception:
            return None
    
    def get_protein_tag_name(self, product):
        try:
            protein_tag = ProteinTag.objects.filter(protein_tag_code=product.protein_tag_code).first()
            return protein_tag.protein_tag_name
        except Exception:
            return None
    
    def get_fluorescene_marker_name(self, product):
        try:
            fluorescene_marker = FluoresceneMarker.objects.filter(fluorescene_marker_code=product.fluorescene_marker_code).first()
            return fluorescene_marker.fluorescene_marker_name
        except Exception:
            return None
    
    def get_selection_marker_name(self, product):
        try:
            selection_marker = SelectionMarker.objects.filter(selection_marker_code=product.selection_marker_code).first()
            return selection_marker.selection_marker_name
        except Exception:
            return None
    
    def get_bacterial_marker_name(self, product):
        try:
            bacterial_marker_queryset = BacterialMarker.objects.filter(bacterial_marker_code=product.bacterial_marker_code).values("bacterial_marker_name")
            bacterial_marker_special_case_queryset = BacterialMarkerSpecialCase.objects.filter(bacterial_marker_code=product.bacterial_marker_code).values("bacterial_marker_name")
            bacterial_marker = bacterial_marker_queryset.union(bacterial_marker_special_case_queryset)[0]
            return bacterial_marker['bacterial_marker_name']
        except Exception:
            return None
    
    def get_delivery_format_name(self, product):
        try:
            delivery_format = DeliveryLibrary.objects.filter(delivery_format_symbol=product.delivery_format_code).first()
            return delivery_format.delivery_format_name
        except Exception:
            return None

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
        model = FeaturedProduct
        fields = ['product_name', 'catalog_number', 'unit_price', 'image']
    
    def get_unit_price(self, product):
        up = UnitPrice.objects.filter(union=product.union).first()
        return up.unit_price if up else None

    def get_image(self, product):
        img = Image.objects.filter(union=product.union).first()
        return img.image.url if img and img.image else None


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
