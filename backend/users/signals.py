from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, DeliveryProfile


@receiver(post_save, sender=User)
def create_or_update_delivery_profile(sender, instance, created, **kwargs):
    """
    Automatically create a DeliveryProfile whenever a User with
    role=DELIVERY is saved (both on creation and role change via Admin).
    """
    if instance.role == User.Role.DELIVERY:
        DeliveryProfile.objects.get_or_create(
            user=instance,
            defaults={'is_active': True}
        )
