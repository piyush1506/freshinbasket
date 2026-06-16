from django.db import models
from users.models import User


class DeliveryLocation(models.Model):
    delivery_boy = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='live_location'
    )

    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.delivery_boy.username

