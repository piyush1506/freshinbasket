from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator

phone_validator = RegexValidator(
    regex=r'^\d{10}$',
    message='please enter a valid 10-digit phone number'
)

username_validator = RegexValidator(
    regex =r'^[\w\s\-]*$',
    message='Username may contain letters, numbers, spaces, underscores, and hyphens.'
    
)


class UserManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        ADMIN = 'ADMIN', 'Admin'
        DELIVERY = 'DELIVERY', 'Delivery Boy'
    username = models.CharField(max_length=150,
    unique=False,
    blank=True,
    null=True,
    validators=[username_validator])

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.CUSTOMER)
    phone_number = models.CharField(max_length=10, validators=[phone_validator], unique=True)
    address = models.TextField(blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.username} ({self.role})"

class OTPVerification(models.Model):
    phone_number = models.CharField(max_length=15)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)  # track wrong guesses
    max_attempts = models.PositiveSmallIntegerField(default=5)  # lock after 5 wrong tries

    def is_locked(self):
        return self.attempts >= self.max_attempts

    def __str__(self):
        return f"{self.phone_number} - {self.otp_code}"
