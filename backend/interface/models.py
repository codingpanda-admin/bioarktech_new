from django.db import models
from django.core.exceptions import ValidationError
from tinymce.models import HTMLField

# Create your models here.
class ProductMode(models.Model):
    url = models.CharField()
    title = models.CharField(max_length=60)
    content = HTMLField()
    image = models.ImageField(blank=True, null=True)

    class Meta:
        db_table = 'product_mode'

class ServiceMode(models.Model):
    url = models.CharField()
    title = models.CharField(max_length=60)
    catalog_number = models.CharField(max_length=100, blank=True, null=True)
    show_catalog_number = models.BooleanField(default=True)
    short_description = models.CharField(max_length=500, blank=True, default='')
    content = HTMLField()
    technique = HTMLField(blank=True, default='')
    price = HTMLField(blank=True, default='')
    performance_data = models.TextField(blank=True, default='')
    manuals = models.JSONField(default=list, blank=True)
    videos = models.JSONField(default=list, blank=True)
    image = models.ImageField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    category_ref = models.ForeignKey(
        'products.ProductCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services',
    )
    service_group = models.CharField(max_length=100, blank=True, null=True)
    catalog_group = models.ForeignKey(
        'products.CatalogGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services',
    )
    is_featured = models.BooleanField(default=False)
    presented_service = models.BooleanField(default=False)
    show_on_screen = models.BooleanField(default=False)
    hidden = models.BooleanField(default=False)

    class Meta:
        db_table = 'service_mode'

    def save(self, *args, **kwargs):
        from products.models import CatalogGroup, ProductCategory

        if not self.category_ref_id and self.category:
            self.category_ref = ProductCategory.objects.filter(external_id=self.category).first()

        if self.catalog_group_id:
            if self.category_ref_id and self.catalog_group.category_id != self.category_ref_id:
                raise ValidationError({'catalog_group': 'The selected group must belong to the selected category.'})
            self.category_ref = self.catalog_group.category
            self.service_group = self.catalog_group.group_name
        elif self.category_ref_id and self.service_group:
            normalized_name = CatalogGroup.normalize_name(self.service_group)
            if normalized_name:
                self.catalog_group, _ = CatalogGroup.objects.get_or_create(
                    category=self.category_ref,
                    normalized_name=normalized_name,
                    defaults={'group_name': str(self.service_group).strip()},
                )
                self.service_group = self.catalog_group.group_name

        if self.category_ref_id:
            category_type = str(self.category_ref.product_type or '').strip().lower()
            if category_type and category_type != 'service':
                raise ValidationError({'category_ref': 'A service must belong to a Service category.'})
            self.category = self.category_ref.external_id

        if self.catalog_group_id and self.category_ref_id != self.catalog_group.category_id:
            raise ValidationError({'catalog_group': 'The selected group must belong to the selected category.'})

        super().save(*args, **kwargs)

class HomepageSlide(models.Model):
    id = models.AutoField(primary_key=True)
    eyebrow = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    primary_button_text = models.CharField(max_length=100, blank=True, null=True)
    primary_button_link = models.CharField(max_length=255, blank=True, null=True)
    secondary_button_text = models.CharField(max_length=100, blank=True, null=True)
    secondary_button_link = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    video_url = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'homepage_slide'
        ordering = ['display_order', 'id']


class AboutWhoWeAre(models.Model):
    id = models.BigAutoField(primary_key=True)
    slug = models.SlugField(max_length=50, unique=True, default='main')
    page_title = models.CharField(max_length=255, default='Why BioArk')
    page_subtitle = models.CharField(max_length=255, blank=True, default='')
    section_title = models.CharField(max_length=255, default='Who We Are')
    paragraphs = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'about_who_we_are'
        verbose_name_plural = 'About: Who We Are'

    def __str__(self):
        return self.section_title


class AboutHighlight(models.Model):
    id = models.BigAutoField(primary_key=True)
    icon = models.CharField(max_length=50, blank=True, default='')
    title = models.CharField(max_length=255)
    text = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'about_highlight'
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(
                fields=['is_active', 'display_order'],
                name='about_highlight_active_idx',
            ),
        ]

    def __str__(self):
        return self.title


class AboutTeamMember(models.Model):
    id = models.BigAutoField(primary_key=True)
    initials = models.CharField(max_length=10, blank=True, default='')
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    image_url = models.TextField(blank=True, default='')
    short_bio = models.TextField(blank=True, default='')
    full_bio = models.JSONField(default=list, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'about_team_member'
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(
                fields=['is_active', 'display_order'],
                name='about_team_active_idx',
            ),
        ]

    def __str__(self):
        return self.name


class InvestorCompanyOverview(models.Model):
    id = models.BigAutoField(primary_key=True)
    slug = models.SlugField(max_length=50, unique=True, default='main')
    page_title = models.CharField(max_length=255, default='Our Investors')
    page_subtitle = models.TextField(blank=True, default='')
    section_title = models.CharField(
        max_length=255,
        default='Company Overview & Vision',
    )
    strategy_section_title = models.CharField(
        max_length=255,
        default='Our Three-Tiered Strategy',
    )
    roadmap_section_title = models.CharField(
        max_length=255,
        default='Development Roadmap & Milestones',
    )
    paragraphs = models.JSONField(default=list, blank=True)
    image_url = models.TextField(blank=True, default='')
    image_alt = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'investor_company_overview'
        verbose_name_plural = 'Investors: Company Overview & Vision'

    def __str__(self):
        return self.section_title


class InvestorStrategyTier(models.Model):
    id = models.BigAutoField(primary_key=True)
    icon = models.CharField(max_length=50, blank=True, default='')
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, default='')
    items = models.JSONField(default=list, blank=True)
    note = models.TextField(blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'investor_strategy_tier'
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(
                fields=['is_active', 'display_order'],
                name='invest_strategy_active_idx',
            ),
        ]

    def __str__(self):
        return self.title


class InvestorRoadmapMilestone(models.Model):
    id = models.BigAutoField(primary_key=True)
    phase = models.CharField(max_length=100)
    goal = models.TextField()
    period_and_funding = models.CharField(max_length=255, blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'investor_roadmap_milestone'
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(
                fields=['is_active', 'display_order'],
                name='invest_roadmap_active_idx',
            ),
        ]

    def __str__(self):
        return self.phase


class InvestorPartnerSection(models.Model):
    BUTTON_TARGET_CHOICES = [
        ('_self', 'Same tab'),
        ('_blank', 'New tab'),
    ]

    id = models.BigAutoField(primary_key=True)
    slug = models.SlugField(max_length=50, unique=True, default='main')
    section_title = models.CharField(max_length=255, default='Partner with BioArk')
    text = models.TextField(blank=True, default='')
    button_text = models.CharField(max_length=100, blank=True, default='')
    button_url = models.CharField(max_length=500, blank=True, default='')
    button_target = models.CharField(
        max_length=20,
        choices=BUTTON_TARGET_CHOICES,
        default='_self',
    )
    button_style = models.CharField(max_length=50, blank=True, default='primary')
    contact_email = models.EmailField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'investor_partner_section'
        verbose_name_plural = 'Investors: Partner with BioArk'

    def __str__(self):
        return self.section_title

