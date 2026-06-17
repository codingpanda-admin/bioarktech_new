from django.contrib import admin
from import_export.admin import ImportExportActionModelAdmin
from import_export import resources
from .models import GeneLibrary

# Register your models here.

class GeneLibraryResource(resources.ModelResource):
    class Meta:
        model = GeneLibrary
        import_id_fields = ('gene_library_id',)

@admin.register(GeneLibrary)
class GeneLibraryAdmin(ImportExportActionModelAdmin):
    resource_classes = [GeneLibraryResource]
    list_display = ('gene_library_id', 'target_sequence', 'gene_name', 'symbol')