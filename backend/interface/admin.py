from django.contrib import admin
from .models import *

# Register your models here.
@admin.register(ProductMode)
class ProductModeAdmin(admin.ModelAdmin):
    list_display = ("url", "title")

@admin.register(ServiceMode)
class ServiceModeAdmin(admin.ModelAdmin):
    list_display = ("url", "title")