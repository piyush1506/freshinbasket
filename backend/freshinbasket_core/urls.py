from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from orders.admin_views import DeliveryDashboardView
from notifications.admin_views import SendNotificationView
from orders.test_order_view import CreateTestOrderView

# --- START OF ADMIN REGROUPING PATCH ---
original_get_app_list = admin.site.get_app_list

def custom_get_app_list(request, app_label=None):
    app_dict = admin.site._build_app_dict(request)
    if app_label:
        return [app_dict[app_label]] if app_label in app_dict else []

    groups = {
        'Store Management': {
            'name': 'Store Management',
            'app_label': 'store_management',
            'app_url': '',
            'has_module_perms': True,
            'models': []
        },
        'Delivery Management': {
            'name': 'Delivery Management',
            'app_label': 'delivery_management',
            'app_url': '',
            'has_module_perms': True,
            'models': []
        },
        'Token Management': {
            'name': 'Token Management',
            'app_label': 'token_management',
            'app_url': '',
            'has_module_perms': True,
            'models': []
        },
        'Other Settings': {
            'name': 'Other Settings',
            'app_label': 'other_settings',
            'app_url': '',
            'has_module_perms': True,
            'models': []
        }
    }

    store_models = {'User', 'Product', 'Order', 'Slide', 'Section', 'Category', 'SubProduct', 'Unit', 'OrderProduct', 'StoreSettings'}
    delivery_models = {'DeliveryAssignment', 'DeliveryCluster', 'DeliveryBoy'}
    token_models = {'FCMToken', 'BlacklistedToken', 'OutstandingToken'}
    system_models = {'ClockedSchedule', 'CrontabSchedule', 'SolarSchedule', 'IntervalSchedule', 'PeriodicTask', 'Group'}
    
    for app in app_dict.values():
        for model in app['models']:
            obj_name = model.get('object_name')
            if obj_name == 'TestOrder':
                model['add_url'] = '/admin-3a3aw44r34/test-order/'
                groups['Other Settings']['models'].append(model)
            elif obj_name in store_models:
                groups['Store Management']['models'].append(model)
            elif obj_name in delivery_models:
                groups['Delivery Management']['models'].append(model)
            elif obj_name in token_models:
                groups['Token Management']['models'].append(model)
            elif obj_name in system_models:
                groups['Other Settings']['models'].append(model)
            else:
                groups['Other Settings']['models'].append(model)
                
    for group in groups.values():
        group['models'].sort(key=lambda x: x['name'])
        
    # Inject Manual Groups link into Store Management
    groups['Store Management']['models'].append({
        'name': 'Manual Groups',
        'object_name': 'ManualGroup',
        'admin_url': '/admin-3a3aw44r34/orders/deliveryassignment/manual-assign/',
        'add_url': None,
        'view_only': True,
    })
    
    # Inject Create Test Order link into Other Settings
    groups['Other Settings']['models'].append({
        'name': '🧪 Create Test Order',
        'object_name': 'CreateTestOrder',
        'admin_url': '/admin-3a3aw44r34/test-order/',
        'add_url': None,
        'view_only': True,
    })
        
    return [group for group in groups.values() if group['models']]

admin.site.get_app_list = custom_get_app_list
# --- END OF ADMIN REGROUPING PATCH ---

urlpatterns = [
    path('admin-3a3aw44r34/delivery-dashboard/', DeliveryDashboardView.as_view(), name='admin_delivery_dashboard'),
    path('admin-3a3aw44r34/notifications/send/', SendNotificationView.as_view(), name='admin_send_notification'),
    path('admin-3a3aw44r34/test-order/', CreateTestOrderView.as_view(), name='admin_create_test_order'),
    path('admin-3a3aw44r34/', admin.site.urls),
    path('api/v1/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
