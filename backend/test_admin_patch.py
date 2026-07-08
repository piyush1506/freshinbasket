import os
import django
from django.test import RequestFactory

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshinbasket_core.settings')
django.setup()

from django.contrib import admin

request = RequestFactory().get('/')
request.user = type('User', (), {'is_active': True, 'is_staff': True, 'is_superuser': True, 'has_module_perms': lambda self, app_label: True, 'has_perm': lambda self, perm: True})()

apps = admin.site.get_app_list(request)
for app in apps:
    print(f"App: {app['app_label']}")
    for model in app['models']:
        print(f"  - {model['object_name']}")
