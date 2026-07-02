import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshinbasket_core.settings')

app = Celery('freshinbasket_core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
