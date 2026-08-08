from django.db import models

# Create your models here.
class GeneLibrary(models.Model):
    gene_library_id = models.AutoField(primary_key=True)
    target_sequence = models.CharField(max_length=6)
    gene_name = models.CharField()
    abbreviation = models.CharField(blank=True, null=True)
    symbol = models.CharField()
    locus_id = models.IntegerField(null=True)
    species = models.CharField(null=True)
    description = models.CharField(blank=True, null=True)
    reference_link = models.CharField(null=True)

    class Meta:
        db_table = 'gene_library'


class GeneDesignCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_category'
        ordering = ['display_order', 'id']
        verbose_name_plural = 'gene design categories'

    def __str__(self):
        return self.name


class GeneDesignFunctionType(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(
        GeneDesignCategory,
        on_delete=models.PROTECT,
        related_name='function_types',
    )
    symbol_id = models.CharField(max_length=10, unique=True)
    abbreviation = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_function_type'
        ordering = ['category_id', 'display_order', 'id']
        indexes = [
            models.Index(
                fields=['category', 'is_active', 'display_order'],
                name='gene_design_fn_cat_idx',
            ),
        ]

    def __str__(self):
        return self.name


class GeneDesignDeliveryType(models.Model):
    id = models.BigAutoField(primary_key=True)
    symbol_id = models.CharField(max_length=10, unique=True)
    abbreviation = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=100)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_delivery_type'
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(
                fields=['is_active', 'display_order'],
                name='gene_design_delivery_idx',
            ),
        ]

    def __str__(self):
        return self.name


class GeneDesignStructureSubstep(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_structure_substep'
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class GeneDesignStructureOption(models.Model):
    id = models.BigAutoField(primary_key=True)
    substep = models.ForeignKey(
        GeneDesignStructureSubstep,
        on_delete=models.PROTECT,
        related_name='options',
    )
    value = models.CharField(max_length=100)
    value_code = models.CharField(max_length=10)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_structure_option'
        ordering = ['substep_id', 'display_order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['substep', 'value_code'],
                name='gene_design_struct_code_uniq',
            ),
            models.UniqueConstraint(
                fields=['substep', 'value'],
                name='gene_design_struct_value_uniq',
            ),
        ]
        indexes = [
            models.Index(
                fields=['substep', 'is_active', 'display_order'],
                name='gene_design_struct_opt_idx',
            ),
        ]

    def __str__(self):
        return f'{self.substep.name}: {self.value}'


class GeneDesignTargetGeneOption(models.Model):
    id = models.BigAutoField(primary_key=True)
    code_id = models.CharField(max_length=20, unique=True)
    abbreviation = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_target_gene_option'
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(
                fields=['is_active', 'display_order'],
                name='gene_design_target_gene_idx',
            ),
        ]

    def __str__(self):
        return self.name


class GeneDesignFormatType(models.Model):
    id = models.BigAutoField(primary_key=True)
    code_id = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    shipping_temperature = models.CharField(max_length=100)
    storage = models.CharField(max_length=100)
    stability = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_format_type'
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class GeneDesignFormatOption(models.Model):
    id = models.BigAutoField(primary_key=True)
    format_type = models.ForeignKey(
        GeneDesignFormatType,
        on_delete=models.PROTECT,
        related_name='options',
    )
    unit_amount = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gene_design_format_option'
        ordering = ['format_type_id', 'display_order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['format_type', 'unit_amount'],
                name='gene_design_format_unit_uniq',
            ),
        ]
        indexes = [
            models.Index(
                fields=['format_type', 'is_active', 'display_order'],
                name='gene_design_format_opt_idx',
            ),
        ]

    def __str__(self):
        return f'{self.format_type.name}: {self.unit_amount}'
