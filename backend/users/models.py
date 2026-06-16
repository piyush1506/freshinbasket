from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

phone_validator = RegexValidator(
    regex=r'^\d{10}$',
    message='please enter a valid 10-digit phone number'
)

username_validator = RegexValidator(
    regex =r'^[\w\s\-]*$',
    message='Username may contain letters, numbers, spaces, underscores, and hyphens.'
    
)


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        ADMIN = 'ADMIN', 'Admin'
        DELIVERY = 'DELIVERY', 'Delivery Boy'
    username = models.CharField(max_length=150,
    unique=False,
    validators=[username_validator])

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.CUSTOMER)
    phone_number = models.CharField(max_length=10, validators=[phone_validator],blank=True,null=True, unique=True )
    address = models.TextField(blank=True, null=True)
    email = models.EmailField(unique=True)
    avatar = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'        
    REQUIRED_FIELDS = ['username']  


    def __str__(self):
        return f"{self.username} ({self.role})"
