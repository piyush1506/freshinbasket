from django.core.checks import Critical, register, Tags
from django.conf import settings
import os


@register(Tags.security)
def check_secret_key(app_configs, **kwargs):
    key = os.getenv('DJANGO_SECRET_KEY', '')
    if not key or key == 'change-me-in-production':
        return [Critical(
            'DJANGO_SECRET_KEY is not set or is using the insecure default value',
            hint='Set DJANGO_SECRET_KEY environment variable to a secure random value',
            id='api.E001',
        )]
    return []


@register(Tags.security)
def check_db_password(app_configs, **kwargs):
    if settings.DATABASES['default']['PASSWORD'] in (None, ''):
        return [Critical(
            'Database password is not set (DB_PASSWORD env var)',
            hint='Set DB_PASSWORD environment variable for production',
            id='api.E002',
        )]
    return []


@register(Tags.security)
def check_cloudinary_config(app_configs, **kwargs):
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    api_key = os.getenv('CLOUDINARY_API_KEY', '')
    if not cloud_name or not api_key:
        return [Critical(
            'Cloudinary credentials are not fully configured',
            hint='Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET',
            id='api.E003',
        )]
    return []


@register(Tags.security)
def check_debug_mode(app_configs, **kwargs):
    if settings.DEBUG:
        return [Critical(
            'Django is running in DEBUG mode',
            hint='Set DJANGO_DEBUG=False in production',
            id='api.E004',
        )]
    return []
