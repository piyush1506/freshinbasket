import logging
from django.core.cache.backends.redis import RedisCache

logger = logging.getLogger(__name__)

class SafeRedisCache(RedisCache):
    """
    A Redis cache backend that catches connection and operational exceptions
    gracefully, logging a warning and falling back to a cache miss (None/False)
    instead of crashing the application when Redis is down.
    """
    def get(self, key, default=None, version=None):
        try:
            return super().get(key, default, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on get: {e}")
            return default

    def set(self, key, value, timeout=None, version=None):
        try:
            return super().set(key, value, timeout, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on set: {e}")
            return False

    def add(self, key, value, timeout=None, version=None):
        try:
            return super().add(key, value, timeout, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on add: {e}")
            return False

    def get_many(self, keys, version=None):
        try:
            return super().get_many(keys, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on get_many: {e}")
            return {}

    def set_many(self, data, timeout=None, version=None):
        try:
            return super().set_many(data, timeout, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on set_many: {e}")
            return []

    def delete(self, key, version=None):
        try:
            return super().delete(key, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on delete: {e}")
            return False

    def delete_many(self, keys, version=None):
        try:
            return super().delete_many(keys, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on delete_many: {e}")
            return False

    def clear(self):
        try:
            return super().clear()
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on clear: {e}")
            return False

    def touch(self, key, timeout=None, version=None):
        try:
            return super().touch(key, timeout, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on touch: {e}")
            return False

    def has_key(self, key, version=None):
        try:
            return super().has_key(key, version)
        except Exception as e:
            logger.warning(f"Redis cache connection/operation error on has_key: {e}")
            return False
