from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from orders.admin_views import DeliveryDashboardView
from notifications.admin_views import SendNotificationView

urlpatterns = [
    path('admin/delivery-dashboard/', DeliveryDashboardView.as_view(), name='admin_delivery_dashboard'),
    path('admin/notifications/send/', SendNotificationView.as_view(), name='admin_send_notification'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
