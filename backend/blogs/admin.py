from django.contrib import admin
from .models import Blog, BlogCategory

# Register your models here.
@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'author', 'date_posted', 'date_modified')
    list_filter = ('category', 'date_posted', 'date_modified')
    search_fields = ('title', 'author')
    date_hierarchy = 'date_posted'
    ordering = ('-date_posted',)

    def save_model(self, request, obj, form, change):
        if not obj.author:
            obj.author = request.user.username
        super().save_model(request, obj, form, change)


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'display_order', 'is_active')
    list_editable = ('display_order', 'is_active')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order', 'name')
