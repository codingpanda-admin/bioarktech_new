from django.contrib import admin
from .models import *

# Register your models here.
@admin.register(ProductMode)
class ProductModeAdmin(admin.ModelAdmin):
    list_display = ("url", "title")

@admin.register(ServiceMode)
class ServiceModeAdmin(admin.ModelAdmin):
    list_display = ("url", "title", "catalog_number", "category", "service_group")


@admin.register(AboutWhoWeAre)
class AboutWhoWeAreAdmin(admin.ModelAdmin):
    list_display = ('section_title', 'page_title', 'is_active', 'updated_at')


@admin.register(AboutHighlight)
class AboutHighlightAdmin(admin.ModelAdmin):
    list_display = ('title', 'display_order', 'is_active', 'updated_at')
    list_editable = ('display_order', 'is_active')


@admin.register(AboutTeamMember)
class AboutTeamMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'display_order', 'is_active', 'updated_at')
    list_editable = ('display_order', 'is_active')


@admin.register(InvestorCompanyOverview)
class InvestorCompanyOverviewAdmin(admin.ModelAdmin):
    list_display = ('section_title', 'page_title', 'is_active', 'updated_at')


@admin.register(InvestorStrategyTier)
class InvestorStrategyTierAdmin(admin.ModelAdmin):
    list_display = ('title', 'subtitle', 'display_order', 'is_active', 'updated_at')
    list_editable = ('display_order', 'is_active')


@admin.register(InvestorRoadmapMilestone)
class InvestorRoadmapMilestoneAdmin(admin.ModelAdmin):
    list_display = ('phase', 'period_and_funding', 'display_order', 'is_active', 'updated_at')
    list_editable = ('display_order', 'is_active')


@admin.register(InvestorPartnerSection)
class InvestorPartnerSectionAdmin(admin.ModelAdmin):
    list_display = (
        'section_title',
        'button_text',
        'button_url',
        'button_target',
        'is_active',
        'updated_at',
    )
