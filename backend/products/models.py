from django.db import models
from django.db.models import Q
from django.contrib.postgres.fields import ArrayField
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
    external_id = models.CharField(blank=True, null=True)
    product_type = models.CharField(blank=True, null=True)

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

class Img(models.Model):
    id = models.AutoField(primary_key=True)
    image_path = models.TextField()

    class Meta:
        db_table = 'img'

    def __str__(self):
        return self.image_path

class Product(models.Model):
    product_id = models.BigAutoField(primary_key=True)
    external_id = models.CharField(max_length=100, unique=True)
    product_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    product_link = models.TextField(blank=True, null=True)
    category_external_id = models.CharField(max_length=100, blank=True, null=True)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True, db_column='category_id', related_name='products')
    product_group = models.CharField(max_length=100, blank=True, null=True)
    source_type = models.CharField(max_length=50, blank=True, null=True)
    display_order = models.IntegerField(blank=True, null=True)
    source_created_at_ms = models.BigIntegerField(blank=True, null=True)
    source_created_at = models.DateTimeField(blank=True, null=True)
    catalog_number = models.CharField(max_length=100, blank=True, null=True)
    availability = models.CharField(max_length=100, blank=True, null=True)
    list_price = models.CharField(max_length=100, blank=True, null=True)
    price_range = models.CharField(max_length=100, blank=True, null=True)
    quote_only = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    show_on_screen = models.BooleanField(default=False)
    show_in_featured = models.BooleanField(default=False)
    show_in_gene_editing = models.BooleanField(default=False)
    key_features = ArrayField(models.TextField(), default=list, blank=True)
    options = ArrayField(models.TextField(), default=list, blank=True)
    option_prices = models.JSONField(default=dict, blank=True)
    storage_stability = models.TextField(blank=True, null=True)
    performance_data = models.TextField(blank=True, null=True)
    data_description = models.TextField(blank=True, null=True)
    manuals = ArrayField(models.TextField(), default=list, blank=True)
    manual_urls = ArrayField(models.TextField(), default=list, blank=True)
    images = ArrayField(models.TextField(), default=list, blank=True)
    store_link = models.TextField(blank=True, null=True)
    content_text = models.TextField(blank=True, null=True)
    hidden = models.BooleanField(default=False)
    raw_product = models.JSONField(blank=True, null=True)
    raw_override = models.JSONField(blank=True, null=True)
    raw_detail = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    images_relation = models.ManyToManyField(Img, through='ProductImage', blank=True)

    class Meta:
        db_table = 'product'


class ProductImage(models.Model):
    image_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, db_column='product_id', related_name='product_images', on_delete=models.CASCADE)
    img = models.ForeignKey(Img, db_column='img_id', related_name='product_images', on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = 'product_images_association'
        unique_together = ('product', 'img')


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


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Product)
def sync_product_relations(sender, instance, **kwargs):
    # 1. Sync category ForeignKey without trigger loop
    if instance.category_external_id:
        try:
            cat_obj = ProductCategory.objects.filter(external_id=instance.category_external_id).first()
            if cat_obj and instance.category_id != cat_obj.category_id:
                Product.objects.filter(product_id=instance.product_id).update(category=cat_obj)
        except Exception:
            pass

    # 2. Sync Img and ProductImage relations
    try:
        image_paths = []
        if instance.image_url:
            image_paths.append(instance.image_url)
        if instance.images:
            for img_path in instance.images:
                if img_path and img_path not in image_paths:
                    image_paths.append(img_path)

        current_links = list(ProductImage.objects.filter(product=instance).values_list('img__image_path', flat=True))

        if set(image_paths) != set(current_links):
            ProductImage.objects.filter(product=instance).delete()
            for path in image_paths:
                if not path:
                    continue
                img_obj, _ = Img.objects.get_or_create(image_path=path)
                ProductImage.objects.get_or_create(product=instance, img=img_obj)
    except Exception:
        pass

