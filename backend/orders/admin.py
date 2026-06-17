from django.contrib import admin
from .models import *
from import_export.admin import ImportExportActionModelAdmin
from import_export import resources

class WorkScheduleResource(resources.ModelResource):
    class Meta:
        model = WorkSchedule
        import_id_fields = ('id',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'payment_token', 'total_price', 'total_paid', 'quantity', 'shipping_address', 'order_placed_date',
                    'order_process_date', 'delivery_date', 'billing_date', 'fulfilled', 'paid', 'user')
    list_filter = ('order_placed_date', 'delivery_date')
    search_fields = ('order_id',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'order', 'billing_date', 'is_paid', 'invoice_due', 'invoice_payment', 'po_file', 'po_number')

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ('quote_number', 'quote_file', 'description', 'price', 'total_price', 'product_sku', 'product_name', 'quantity', 'unit_size', 'user')

@admin.register(CloningCRISPRItem)
class CloningCRISPROrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class="Cloning-CRISPR")

@admin.register(CloningOverexpressionItem)
class CloningOverexpressionOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class="Cloning-Overexpression")

@admin.register(CloningRNAiItem)
class CloningRNAiOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class="Cloning-RNAi")

@admin.register(OpenOrderItem)
class OpenOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(status="open")

@admin.register(CRISPRInProgressOrderItem)
class CRISPRInProgressOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class='Cloning-CRISPR', status__in=["in_progress", "ready_for_delivery"])

@admin.register(OverexpressionInProgressOrderItem)
class OverexpressionInProgressOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class='Cloning-Overexpression', status__in=["in_progress", "ready_for_delivery"])

@admin.register(RNAiInProgressOrderItem)
class RNAiInProgressOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class='Cloning-RNAi', status__in=["in_progress", "ready_for_delivery"])

@admin.register(ReagentInProgressOrderItem)
class ReagentInProgressOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class='Reagents', status__in=["in_progress", "ready_for_delivery"])

@admin.register(OtherInProgressOrderItem)
class OtherInProgressOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(order_class='Other', status__in=["in_progress", "ready_for_delivery"])

@admin.register(FinalizedOrderItem)
class FinalizedOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order_id', 'product_sku', 'product_name', 'ready_status', 'total_price', 'unit_size', 'quantity', 'status', 'order_placed_date', 'work_period', 'est_delivery_date', 'shipping_date', 'delivery_date', 'billing_date')
    # search_fields = ('name',)  # Add search functionality

    def get_queryset(self, request):
        # Override to ensure the filtered queryset
        qs = super().get_queryset(request)
        return qs.filter(status__in=["invoiced", "paid"])

@admin.register(WorkSchedule)
class WorkScheduleAdmin(ImportExportActionModelAdmin):
    resources = [WorkScheduleResource]
    list_display = ('id', 'structure_type_code', 'delivery_format_code', 'ready_status', 'work_period_earliest', 'work_period_latest', 'shipping_temp', 'storage_temp', 'stability_period')
