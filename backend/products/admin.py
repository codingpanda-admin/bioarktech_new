from django.contrib import admin
from .models import *
from import_export.admin import ImportExportActionModelAdmin
from import_export import resources


# Register your models here.
class ProductResource(resources.ModelResource):
    class Meta:
        model = Product
        import_id_fields = ('product_id',)

class DesignLibraryResource(resources.ModelResource):
    class Meta:
        model = DesignLibrary
        import_id_fields = ('id',)

class DeliveryLibraryResource(resources.ModelResource):
    class Meta:
        model = DeliveryLibrary
        import_id_fields = ('delivery_library_id',)

@admin.register(Product)
class ProductAdmin(ImportExportActionModelAdmin):
    resource_classes = [ProductResource]
    list_display = ('product_id', 'product_sku', 'product_name', 'unit_price', 'unit_size', 'ready_status')

@admin.register(FeaturedProduct)
class FeaturedProductAdmin(admin.ModelAdmin):
    list_display = ('catalog_number', 'product_name', 'on_display', 'shelf_status', 'units_in_stock', 'union')
    ordering = ('on_display',)

@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('union', 'main_display', 'image')

@admin.register(ManualFile)
class ManualFileAdmin(admin.ModelAdmin):
    list_display = ('union', 'name', 'manual')

@admin.register(UnitPrice)
class UnitPriceAdmin(admin.ModelAdmin):
    list_display = ('union', 'unit_size', 'unit_price')

@admin.register(ProductInventory)
class ProductInventoryAdmin(admin.ModelAdmin):
    list_display = ('inventory_id', 'units_in_stock', 'units_on_order', 'loaded', 'currency', 'manufacturer')

@admin.register(DeliveryLibrary)
class DeliveryLibraryAdmin(ImportExportActionModelAdmin):
    resource_classes = [DeliveryLibraryResource]
    list_display = ('delivery_library_id', 'structure_type_symbol', 'delivery_format_symbol', 'function_type_symbol')


@admin.register(DesignLibrary)
class DesignLibraryAdmin(ImportExportActionModelAdmin):
    resource_classes = [DesignLibraryResource]
    list_display = ('id', 'function_type_code', 'structure_type_code', 'target_sequence', 'delivery_format_code', 'shelf_status', 'list_price', 'unit_price')

@admin.register(FunctionType)
class FunctionTypeAdmin(admin.ModelAdmin):
    list_display = ('function_type_id', 'function_type_symbol', 'function_type_name')

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('category_name', 'description')

@admin.register(StructureType)
class StructureTypeAdmin(admin.ModelAdmin):
    list_display = ('structure_type_id', 'structure_type_symbol', 'structure_type_name')

@admin.register(DeliveryFormat)
class DeliveryFormatAdmin(admin.ModelAdmin):
    list_display = ('delivery_format_symbol', 'delivery_format_name')

@admin.register(PromoterSpecialCase)
class PromoterSpecialCaseAdmin(admin.ModelAdmin):
    list_display = ('promoter_id', 'promoter_name', 'function_type_symbol', 'priority')

@admin.register(BacterialMarkerSpecialCase)
class BacterialMarkerSpecialCaseAdmin(admin.ModelAdmin):
    list_display = ('bacterial_marker_name',)

@admin.register(Promoter)
class PromoterAdmin(admin.ModelAdmin):
    pass

@admin.register(ProteinTag)
class ProteinTagAdmin(admin.ModelAdmin):
    pass

@admin.register(FluoresceneMarker)
class FluoresceneMarkerAdmin(admin.ModelAdmin):
    pass

@admin.register(SelectionMarker)
class SelectionMarkerAdmin(admin.ModelAdmin):
    pass

@admin.register(BacterialMarker)
class BacterialMarkerAdmin(admin.ModelAdmin):
    pass
