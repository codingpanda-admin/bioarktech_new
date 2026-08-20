from django.urls import path, include
from django.contrib import admin

from . import views
from .admin_views import (
    admin_dashboard_stats,
    admin_list_product_categories, admin_create_product_category,
    admin_update_product_category, admin_reorder_product_categories,
    admin_delete_product_category,
    admin_list_products, admin_get_product, admin_create_product,
    admin_update_product, admin_delete_product, admin_upload_product_image,
    admin_list_featured_products, admin_get_featured_product,
    admin_create_featured_product, admin_update_featured_product,
    admin_delete_featured_product,
    admin_list_blogs, admin_get_blog, admin_create_blog,
    admin_update_blog, admin_delete_blog,
    admin_list_resources, admin_get_resource, admin_create_resource,
    admin_update_resource, admin_delete_resource,
    admin_list_all_users, admin_get_user, admin_create_user,
    admin_update_user, admin_delete_user, admin_toggle_admin,
    admin_list_quotes, admin_get_quote, admin_mark_quote_read,
    admin_delete_quote,
    admin_list_services, admin_get_service, admin_create_service,
    admin_update_service, admin_delete_service, admin_upload_service_document,
    admin_list_media, admin_upload_media, admin_delete_media,
    admin_list_slides, admin_get_slide, admin_create_slide,
    admin_update_slide, admin_reorder_slides, admin_delete_slide,
    admin_get_smtp_config, admin_update_smtp_config, admin_send_test_email,
    admin_exchange_google_oauth_code,
)


admin.site.site_header = "Bioark Site Administration"
admin.site.site_title = "Bioark Site Administration"
admin.site.index_title = "Database Tables"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('products/', include('products.urls')),
    path('quotes/', include('quote.urls')),
    path('users/', include('users.urls')),
    path('orders/', include('orders.urls')),
    path('blogs/', include('blogs.urls')),
    path('genes/', include('genes.urls')),
    path('interface/', include('interface.urls')),
    path('csrf/', views.get_csrf, name='api-csrf'),
    path('signup/', views.signup_view, name='api-signup'),
    path('login/', views.login_view, name='api-login'),
    path('logout/', views.logout_view, name='api-logout'),
    path('session/', views.session_view, name='api-session'),
    path('whoami/', views.whoami_view, name='api-whoami'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    path('password-reset/', views.request_password_reset, name='password_reset'),
    path('password-reset-confirm/<str:token>/', views.confirm_password_reset, name='password_reset_confirm'),
    path('google-login/', views.google_login, name='google_login'),
    path('contact-us/', views.send_contact_form, name='contact-us'),
    path('quote/', views.send_quote_form, name='quote'),
    path('search/', views.search_product, name='search'),

    # ── Admin Panel API ──────────────────────────────────────────────────
    path('admin-panel/dashboard/', admin_dashboard_stats),

    # Products
    path('admin-panel/product-categories/', admin_list_product_categories),
    path('admin-panel/product-categories/create/', admin_create_product_category),
    path('admin-panel/product-categories/reorder/', admin_reorder_product_categories),
    path('admin-panel/product-categories/<int:category_id>/update/', admin_update_product_category),
    path('admin-panel/product-categories/<int:category_id>/delete/', admin_delete_product_category),
    path('admin-panel/products/', admin_list_products),
    path('admin-panel/products/create/', admin_create_product),
    path('admin-panel/products/upload-image/', admin_upload_product_image),
    path('admin-panel/products/<int:product_id>/', admin_get_product),
    path('admin-panel/products/<int:product_id>/update/', admin_update_product),
    path('admin-panel/products/<int:product_id>/delete/', admin_delete_product),

    # Featured Products
    path('admin-panel/featured-products/', admin_list_featured_products),
    path('admin-panel/featured-products/create/', admin_create_featured_product),
    path('admin-panel/featured-products/<int:fp_id>/', admin_get_featured_product),
    path('admin-panel/featured-products/<int:fp_id>/update/', admin_update_featured_product),
    path('admin-panel/featured-products/<int:fp_id>/delete/', admin_delete_featured_product),

    # Blogs
    path('admin-panel/blogs/', admin_list_blogs),
    path('admin-panel/blogs/create/', admin_create_blog),
    path('admin-panel/blogs/<int:blog_id>/', admin_get_blog),
    path('admin-panel/blogs/<int:blog_id>/update/', admin_update_blog),
    path('admin-panel/blogs/<int:blog_id>/delete/', admin_delete_blog),

    # Resources (documents)
    path('admin-panel/resources/', admin_list_resources),
    path('admin-panel/resources/create/', admin_create_resource),
    path('admin-panel/resources/<int:resource_id>/', admin_get_resource),
    path('admin-panel/resources/<int:resource_id>/update/', admin_update_resource),
    path('admin-panel/resources/<int:resource_id>/delete/', admin_delete_resource),

    # Users
    path('admin-panel/users/', admin_list_all_users),
    path('admin-panel/users/create/', admin_create_user),
    path('admin-panel/users/<int:user_id>/', admin_get_user),
    path('admin-panel/users/<int:user_id>/update/', admin_update_user),
    path('admin-panel/users/<int:user_id>/delete/', admin_delete_user),
    path('admin-panel/users/<int:user_id>/toggle-admin/', admin_toggle_admin),

    # Quotes
    path('admin-panel/quotes/', admin_list_quotes),
    path('admin-panel/quotes/<int:quote_id>/', admin_get_quote),
    path('admin-panel/quotes/<int:quote_id>/mark-read/', admin_mark_quote_read),
    path('admin-panel/quotes/<int:quote_id>/delete/', admin_delete_quote),

    # Services
    path('admin-panel/services/', admin_list_services),
    path('admin-panel/services/create/', admin_create_service),
    path('admin-panel/services/upload-document/', admin_upload_service_document),
    path('admin-panel/services/<int:service_id>/', admin_get_service),
    path('admin-panel/services/<int:service_id>/update/', admin_update_service),
    path('admin-panel/services/<int:service_id>/delete/', admin_delete_service),

    # Media
    path('admin-panel/media/', admin_list_media),
    path('admin-panel/media/upload/', admin_upload_media),
    path('admin-panel/media/<int:image_id>/delete/', admin_delete_media),

    # Homepage Slides
    path('admin-panel/homepage-slides/', admin_list_slides),
    path('admin-panel/homepage-slides/create/', admin_create_slide),
    path('admin-panel/homepage-slides/reorder/', admin_reorder_slides),
    path('admin-panel/homepage-slides/<int:slide_id>/', admin_get_slide),
    path('admin-panel/homepage-slides/<int:slide_id>/update/', admin_update_slide),
    path('admin-panel/homepage-slides/<int:slide_id>/delete/', admin_delete_slide),

    # SMTP Configuration
    path('admin-panel/smtp-config/', admin_get_smtp_config),
    path('admin-panel/smtp-config/update/', admin_update_smtp_config),
    path('admin-panel/smtp-config/send-test/', admin_send_test_email),
    path('admin-panel/smtp-config/exchange-code/', admin_exchange_google_oauth_code),
]



