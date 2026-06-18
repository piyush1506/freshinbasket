import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, Category, Slide, StoreSettings

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=Product)
def clear_product_cache(sender, instance, **kwargs):
    cache.delete('products_list:')
    for slug in instance.categories.values_list('slug', flat=True):
        cache.delete(f'products_list:{slug}')
    cache.delete('home_page')
    # Bump search version to invalidate all search caches
    search_version = cache.get('product_search_version', 1)
    cache.set('product_search_version', search_version + 1, timeout=None)


@receiver([post_save, post_delete], sender=Category)
def clear_category_cache(sender, instance, **kwargs):
    cache.delete('categories_list')
    cache.delete('home_page')
    cache.delete(f'products_list:{instance.slug}')


@receiver([post_save, post_delete], sender=Slide)
def clear_slide_cache(sender, instance, **kwargs):
    cache.delete('slides_list')
    cache.delete('home_page')


@receiver([post_save, post_delete], sender=StoreSettings)
def clear_settings_cache(sender, instance, **kwargs):
    cache.delete('store_settings')