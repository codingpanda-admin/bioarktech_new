from django.contrib import admin
from .models import Quote

# Register your models here.


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'first_name',
        'last_name',
        'email',
        'company',
        'service_type',
        'created_at',
        'read',
    )
    list_filter = ('read', 'service_type', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'company', 'external_id')
    readonly_fields = ('id', 'created_at')
