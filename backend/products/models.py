from decimal import Decimal, InvalidOperation
import re

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.contrib.postgres.fields import ArrayField
from django.dispatch import receiver
from django.db.models.signals import pre_save
from django.utils.text import slugify
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
    summary = HTMLField(blank=True, default='')
    priority = models.IntegerField(default=1)
    external_id = models.CharField(blank=True, null=True)
    product_type = models.CharField(blank=True, null=True)
    show_on_homepage = models.BooleanField(default=False)
    homepage_image = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'product_category'


class CatalogGroup(models.Model):
    group_id = models.AutoField(primary_key=True)
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.CASCADE,
        related_name='catalog_groups',
    )
    group_name = models.CharField(max_length=100)
    external_id = models.SlugField(max_length=160, unique=True)
    normalized_name = models.SlugField(max_length=120)
    description = models.TextField(blank=True, default='')
    summary = HTMLField(blank=True, default='')
    priority = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalog_group'
        ordering = ['priority', 'group_name', 'group_id']
        constraints = [
            models.UniqueConstraint(
                fields=['category', 'normalized_name'],
                name='unique_catalog_group_per_category',
            ),
        ]

    @staticmethod
    def normalize_name(value):
        normalized = slugify(str(value or '').strip())
        return normalized[:120]

    @staticmethod
    def external_id_prefix(category):
        category_type = str(getattr(category, 'product_type', '') or '').strip().lower()
        if category_type in {'reagent', 'consumable'}:
            return 'reagent'
        if category_type == 'service':
            return 'service'
        return 'product'

    @classmethod
    def generate_external_id(cls, category, group_name):
        prefix = cls.external_id_prefix(category)
        name_slug = slugify(str(group_name or '').strip()) or 'group'
        base = f'{prefix}-{name_slug}'[:160].rstrip('-')
        candidate = base
        suffix = 2
        while cls.objects.filter(external_id=candidate).exists():
            suffix_text = f'-{suffix}'
            candidate = f'{base[:160 - len(suffix_text)].rstrip("-")}{suffix_text}'
            suffix += 1
        return candidate

    def save(self, *args, **kwargs):
        self.group_name = str(self.group_name or '').strip()
        self.normalized_name = self.normalize_name(self.group_name)
        if not self.normalized_name:
            raise ValidationError({'group_name': 'Group name must contain letters or numbers.'})

        if not self.external_id:
            self.external_id = self.generate_external_id(self.category, self.group_name)
        else:
            self.external_id = str(self.external_id).strip()

        if not self.external_id:
            raise ValidationError({'external_id': 'External ID is required.'})
        super().save(*args, **kwargs)

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
    catalog_group = models.ForeignKey(CatalogGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    product_group = models.CharField(max_length=100, blank=True, null=True)
    source_type = models.CharField(max_length=50, blank=True, null=True)
    display_order = models.IntegerField(blank=True, null=True)
    source_created_at_ms = models.BigIntegerField(blank=True, null=True)
    source_created_at = models.DateTimeField(blank=True, null=True)
    catalog_number = models.CharField(max_length=100, blank=True, null=True)
    show_catalog_number = models.BooleanField(default=True)
    availability = models.CharField(max_length=100, blank=True, null=True)
    list_price = models.CharField(max_length=100, blank=True, null=True)
    discounted_price = models.CharField(max_length=100, blank=True, null=True)
    price_range = models.CharField(max_length=100, blank=True, null=True)
    quote_only = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    show_on_screen = models.BooleanField(default=False)
    show_in_featured = models.BooleanField(default=False)
    show_in_gene_editing = models.BooleanField(default=False)
    key_features = ArrayField(models.TextField(), default=list, blank=True)
    options = ArrayField(models.TextField(), default=list, blank=True)
    option_prices = models.JSONField(default=dict, blank=True)
    option_discounted_prices = models.JSONField(default=dict, blank=True)
    storage_stability = models.TextField(blank=True, null=True)
    performance_data = models.TextField(blank=True, null=True)
    data_description = models.TextField(blank=True, null=True)
    manuals = ArrayField(models.TextField(), default=list, blank=True)
    manual_urls = ArrayField(models.TextField(), default=list, blank=True)
    images = ArrayField(models.TextField(), default=list, blank=True)
    videos = ArrayField(models.TextField(), default=list, blank=True)
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

    @staticmethod
    def _numeric_catalog_price(value):
        """Return a Decimal only for a single, non-negative catalog price."""
        if value in (None, ''):
            return None
        if isinstance(value, (int, float, Decimal)):
            try:
                parsed = Decimal(str(value))
            except (InvalidOperation, ValueError):
                return None
            return parsed if parsed.is_finite() and parsed >= 0 else None

        text = str(value).strip()
        if not re.fullmatch(r'\$?\s*(?:\d+(?:,\d{3})*|\d+)(?:\.\d+)?', text):
            return None
        try:
            parsed = Decimal(text.replace('$', '').replace(',', '').strip())
        except InvalidOperation:
            return None
        return parsed if parsed.is_finite() and parsed >= 0 else None

    def clean(self):
        super().clean()
        errors = {}

        if self.catalog_group_id and self.category_id and self.catalog_group.category_id != self.category_id:
            errors['catalog_group'] = 'The selected group must belong to the selected category.'

        if self.category_id:
            category_type = str(self.category.product_type or '').strip().lower()
            item_type = 'reagent' if str(self.source_type or '').strip().lower() == 'reagent' else 'product'
            allowed_category_types = {'reagent', 'consumable'} if item_type == 'reagent' else {'product', 'both'}
            if category_type and category_type not in allowed_category_types:
                errors['category'] = f'This category cannot contain a {item_type} item.'

        discounted_price_text = str(self.discounted_price or '').strip()
        if discounted_price_text:
            discounted_price = self._numeric_catalog_price(discounted_price_text)
            list_price = self._numeric_catalog_price(self.list_price)
            if discounted_price is None:
                errors['discounted_price'] = 'Discounted Price must be a non-negative numeric price.'
            elif list_price is None:
                errors['discounted_price'] = 'A numeric List Price is required when Discounted Price is set.'
            elif discounted_price > list_price:
                errors['discounted_price'] = 'Discounted Price cannot exceed List Price.'

        option_prices = self.option_prices if isinstance(self.option_prices, dict) else {}
        option_discounts = (
            self.option_discounted_prices
            if isinstance(self.option_discounted_prices, dict)
            else {}
        )
        top_level_list_price = self._numeric_catalog_price(self.list_price)
        option_errors = []
        for option_name, value in option_discounts.items():
            value_text = '' if value is None else str(value).strip()
            if not value_text:
                continue

            discounted_price = self._numeric_catalog_price(value_text)
            option_list_price = self._numeric_catalog_price(option_prices.get(option_name))
            effective_list_price = option_list_price if option_list_price is not None else top_level_list_price
            label = str(option_name or 'Unnamed option').strip() or 'Unnamed option'
            if discounted_price is None:
                option_errors.append(f'{label}: Discounted Price must be a non-negative numeric price.')
            elif effective_list_price is None:
                option_errors.append(f'{label}: a numeric option price or product List Price is required.')
            elif discounted_price > effective_list_price:
                option_errors.append(f'{label}: Discounted Price cannot exceed its List Price.')

        if option_errors:
            errors['option_discounted_prices'] = option_errors
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        # Keep the discount ceiling invariant for every normal Product write,
        # not only writes coming from the admin editor.
        if not self.category_id and self.category_external_id:
            self.category = ProductCategory.objects.filter(external_id=self.category_external_id).first()

        if self.catalog_group_id:
            if self.category_id and self.catalog_group.category_id != self.category_id:
                raise ValidationError({'catalog_group': 'The selected group must belong to the selected category.'})
            self.category = self.catalog_group.category
            self.product_group = self.catalog_group.group_name
        elif self.category_id and self.product_group:
            normalized_name = CatalogGroup.normalize_name(self.product_group)
            if normalized_name:
                self.catalog_group, _ = CatalogGroup.objects.get_or_create(
                    category=self.category,
                    normalized_name=normalized_name,
                    defaults={'group_name': str(self.product_group).strip()},
                )
                self.product_group = self.catalog_group.group_name

        if self.category_id:
            self.category_external_id = self.category.external_id

        self.clean()
        return super().save(*args, **kwargs)


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


@receiver(post_save, sender=CatalogGroup)
def sync_catalog_group_display_names(sender, instance, **kwargs):
    Product.objects.filter(catalog_group=instance).exclude(product_group=instance.group_name).update(
        product_group=instance.group_name,
    )
    try:
        from interface.models import ServiceMode
        ServiceMode.objects.filter(catalog_group_id=instance.group_id).exclude(
            service_group=instance.group_name,
        ).update(service_group=instance.group_name)
    except Exception:
        # Keep product catalog writes available during early migration states
        # where the interface app may not yet contain the group relationship.
        pass

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

