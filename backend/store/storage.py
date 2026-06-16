import cloudinary
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.conf import settings


class ConfiguredCloudinaryStorage(MediaCloudinaryStorage):
    def _upload(self, name, content):
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
            api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
            api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
        )
        return super()._upload(name, content)
