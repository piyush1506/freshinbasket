import cloudinary
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.conf import settings


class ConfiguredCloudinaryStorage(MediaCloudinaryStorage):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        c_config = getattr(settings, 'CLOUDINARY_STORAGE', {})
        cloudinary.config(
            cloud_name=c_config.get('CLOUD_NAME', 'dwxiu6x7p'),
            api_key=c_config.get('API_KEY', ''),
            api_secret=c_config.get('API_SECRET', ''),
            secure=True
        )

    def _upload(self, name, content):
        c_config = getattr(settings, 'CLOUDINARY_STORAGE', {})
        cloudinary.config(
            cloud_name=c_config.get('CLOUD_NAME', 'dwxiu6x7p'),
            api_key=c_config.get('API_KEY', ''),
            api_secret=c_config.get('API_SECRET', ''),
            secure=True
        )
        return super()._upload(name, content)

    def url(self, name):
        if not name:
            return ""

        name_str = str(name).strip()

        # 1. Detect and fix double-nested URLs (e.g. .../media/https://... or multiple https://)
        if name_str.count('https://') > 1 or name_str.count('http://') > 1 or '/media/http' in name_str:
            last_http = max(name_str.rfind('https://'), name_str.rfind('http://'))
            if last_http > 0:
                name_str = name_str[last_http:]

        # 2. If it's already a complete HTTP/HTTPS URL, return it directly!
        # Do NOT let MediaCloudinaryStorage prepend 'media/' or cloud domain to it.
        if name_str.startswith('http://') or name_str.startswith('https://'):
            return name_str.replace('http://', 'https://')

        # 3. Standard relative media paths (e.g. products/img.png or media/products/img.png)
        return super().url(name_str)
