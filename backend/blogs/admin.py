from django.contrib import admin
from .models import Blog

# Register your models here.
@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'date_posted', 'date_modified')
    list_filter = ('date_posted', 'date_modified')
    search_fields = ('title', 'author')
    date_hierarchy = 'date_posted'
    ordering = ('-date_posted',)

    def save_model(self, request, obj, form, change):
        if not obj.author:
            obj.author = request.user.username
        super().save_model(request, obj, form, change)