from django.db import models
from django.db.models import Q
from django.dispatch import receiver
from django.db.models.signals import pre_save
from tinymce.models import HTMLField


class Promoter(models.Model):
    promoter_id = models.AutoField(primary_key=True)
    promoter_name = models.CharField()
    promoter_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'promoters'

class PromoterSpecialCase(models.Model):
    promoter_id = models.AutoField(primary_key=True)
    promoter_name = models.CharField()
    promoter_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    function_type_symbol = models.CharField()
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'promoters_special_case'


class Property(models.Model):
    property_id = models.AutoField(primary_key=True)
    property_name = models.CharField()
    property_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'property'


class ProteinTag(models.Model):
    protein_tag_id = models.AutoField(primary_key=True)
    protein_tag_name = models.CharField()
    protein_tag_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'protein_tags'


class FluoresceneMarker(models.Model):
    fluorescene_marker_id = models.AutoField(primary_key=True)
    fluorescene_marker_name = models.CharField()
    fluorescene_marker_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'fluorescene_markers'


class SelectionMarker(models.Model):
    selection_marker_id = models.AutoField(primary_key=True)
    selection_marker_name = models.CharField()
    selection_marker_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'selection_markers'


class BacterialMarker(models.Model):
    bacterial_marker_id = models.AutoField(primary_key=True)
    bacterial_marker_name = models.CharField()
    bacterial_marker_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'bacterial_markers'


class BacterialMarkerSpecialCase(models.Model):
    bacterial_marker_id = models.AutoField(primary_key=True)
    bacterial_marker_name = models.CharField()
    bacterial_marker_code = models.CharField()
    priority = models.IntegerField(default=1)
    enabled = models.BooleanField(default=True)
    structure_type_symbol = models.CharField()
    description = models.CharField(blank=True, null=True)

    class Meta:
        db_table = 'bacterial_markers_special_case'


class ProductInventory(models.Model):
    inventory_id = models.AutoField(primary_key=True)
    units_in_stock = models.IntegerField()
    units_on_order = models.IntegerField()
    loaded = models.BooleanField()
    currency = models.CharField()
    manufacturer = models.CharField()

    class Meta:
        db_table = 'product_inventory'


class ProductCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(unique=True)
    description = models.CharField(blank=True, null=True)
    priority = models.IntegerField(default=1)

    class Meta:
        db_table = 'product_category'

class FunctionType(models.Model):
    function_type_id = models.AutoField(primary_key=True)
    function_type_symbol = models.CharField(unique=True) # TODO: enum
    function_type_name = models.CharField(unique=True)
    abbreviation = models.CharField()
    description = models.CharField(blank=True, null=True)
    priority = models.IntegerField(default=1)
    load_status = models.CharField(blank=True, null=True, default="Loaded")
    category = models.CharField()

    class Meta:
        db_table = 'function_types'

class DeliveryLibrary(models.Model):
    delivery_library_id = models.AutoField(primary_key=True)
    structure_type_symbol = models.CharField()
    delivery_format_symbol = models.CharField()
    function_type_symbol = models.CharField()

    class Meta:
        db_table = 'delivery_library'


class StructureType(models.Model):
    structure_type_id = models.AutoField(primary_key=True)
    structure_type_symbol = models.CharField(unique=True)
    structure_type_name = models.CharField(unique=True)
    abbreviation = models.CharField()
    description = models.CharField(blank=True, null=True)
    priority = models.IntegerField(default=1)

    class Meta:
        db_table = 'structure_types'


class DeliveryFormat(models.Model):
    delivery_format_symbol = models.CharField(unique=True)
    delivery_format_name = models.CharField(unique=True)
    description = models.CharField(blank=True, null=True)
    priority = models.IntegerField(default=1)

    class Meta:
        db_table = 'delivery_formats'


class DesignLibrary(models.Model):
    function_type_code = models.CharField()
    structure_type_code = models.CharField()
    delivery_format_code = models.CharField()
    target_sequence = models.CharField(blank=True, null=True)
    shelf_status = models.BooleanField()
    kit_amount = models.CharField()
    unit = models.CharField()
    discount_code = models.CharField(blank=True, null=True)
    on_discount = models.BooleanField(default=True)
    list_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'design_library'

class ProductsUnion(models.Model):
    product_id = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products_union'
    
    def __str__(self):
        return self.product_id

class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_sku = models.CharField()
    product_name = models.CharField()
    description = models.CharField(blank=True, null=True)
    list_price = models.DecimalField(max_digits=8, decimal_places=2)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    unit_size = models.CharField()
    discount_code = models.CharField(blank=True, null=True)
    ready_status = models.CharField(blank=True, null=True)
    target_sequence = models.CharField(max_length=6)
    units_in_stock = models.IntegerField()
    units = models.CharField()
    ship_condition = models.CharField()
    on_discount = models.BooleanField(default=True)
    union = models.OneToOneField(ProductsUnion, on_delete=models.CASCADE, blank=True, null=True)
    # product codes
    function_type_code = models.CharField()
    structure_type_code = models.CharField()
    promoter_code = models.CharField()
    property_code = models.CharField()
    protein_tag_code = models.CharField()
    fluorescene_marker_code = models.CharField()
    selection_marker_code = models.CharField()
    bacterial_marker_code = models.CharField()
    delivery_format_code = models.CharField()

    def save(self, *args, **kwargs):
        if not self.union:
            self.union = ProductsUnion.objects.create(product_id=self.product_sku)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'products'


class FeaturedProduct(models.Model):
    catalog_number = models.CharField(unique=True)
    product_name = models.CharField()
    description = HTMLField()
    key_features = HTMLField()
    performance_data = HTMLField()
    storage_info = HTMLField()
    ship_info = models.CharField()
    shelf_status = models.BooleanField()
    on_display = models.BooleanField(default=False)
    on_discount = models.BooleanField(default=True)
    priority = models.IntegerField(default=1)
    units_in_stock = models.IntegerField()
    units = models.CharField()
    union = models.OneToOneField(ProductsUnion, on_delete=models.CASCADE, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.union:
            self.union = ProductsUnion.objects.create(product_id=self.catalog_number)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'featured_products'


class Image(models.Model):
    union = models.ForeignKey(ProductsUnion, on_delete=models.CASCADE)
    main_display = models.BooleanField(default=False)
    image = models.ImageField(upload_to='product_images')

    class Meta:
        db_table = 'images'

class ManualFile(models.Model):
    union = models.ForeignKey(ProductsUnion, on_delete=models.CASCADE)
    name = models.CharField()
    manual = models.FileField(upload_to='manual_files')

    class Meta:
        db_table = 'manual_files'

class UnitPrice(models.Model):
    union = models.ForeignKey(ProductsUnion, on_delete=models.CASCADE)
    unit_size = models.CharField()
    list_price = models.DecimalField(max_digits=8, decimal_places=2)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    on_discount = models.BooleanField(default=True)

    class Meta:
        db_table = 'unit_prices'

