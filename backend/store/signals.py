from django.db.models.signals import post_save,post_delete
from django.dispatch import receiver
from django.core.cache import cache

from .models import Product,Category

@receiver(post_save,sender=Product)
@receiver(post_delete,sender=Product)
def clear_product_cache(sender,**kwargs):
    cache.delete('home_page')

@receiver(post_save,sender=Category)
@receiver(post_delete,sender=Category)
def clear_category_cache(sender,**kwargs):
    cache.delete('home_page')
    

