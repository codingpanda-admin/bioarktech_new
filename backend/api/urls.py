from django.urls import path, include
from django.contrib import admin

from . import views

admin.site.site_header = "Bioark Site Administration"
admin.site.site_title = "Bioark Site Administration"
admin.site.index_title = "Database Tables"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('products/', include('products.urls')),
    path('users/', include('users.urls')),
    path('orders/', include('orders.urls')),
    path('blogs/', include('blogs.urls')),
    path('interface/', include('interface.urls')),
    path('csrf/', views.get_csrf, name='api-csrf'),
    path('signup/', views.signup_view, name='api-signup'),
    path('login/', views.login_view, name='api-login'),
    path('logout/', views.logout_view, name='api-logout'),
    path('session/', views.session_view, name='api-session'),
    path('whoami/', views.whoami_view, name='api-whoami'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    path('contact-us/', views.send_contact_form, name='contact-us'),
    path('quote/', views.send_quote_form, name='quote'),
    path('search/', views.search_product, name='search'),
]