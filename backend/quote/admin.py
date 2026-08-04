from django.contrib import admin

from .models import Quote


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'external_id', 'first_name', 'last_name', 'email', 'service_type', 'created_at', 'read')
    list_filter = ('read', 'service_type', 'created_at')
    search_fields = ('external_id', 'first_name', 'last_name', 'email', 'company')
    readonly_fields = ('id', 'created_at')

