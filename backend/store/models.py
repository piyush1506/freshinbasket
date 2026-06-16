from django.db import models
from django.conf import settings
from django.utils.text import slugify


class ContactQuery(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    response = models.TextField(blank=True, default='')
    responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Query'
        verbose_name_plural = 'Contact Queries'

    def __str__(self):
        return f"{self.name} - {self.email}"



class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
    


    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        orig_slug = self.slug
        counter = 1
        while Category.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
            self.slug = f"{orig_slug}-{counter}"
            counter += 1
        super().save(*args, **kwargs)


class Unit(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text="e.g. kg, 250g, 1 piece, bunch")
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = 'Unit'
        verbose_name_plural = 'Units'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    categories = models.ManyToManyField(Category, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, help_text="Unit of measurement (e.g. kg, piece, 250g)")
    image_url = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        orig_slug = self.slug
        counter = 1
        while Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
            self.slug = f"{orig_slug}-{counter}"
            counter += 1
        super().save(*args, **kwargs)


class Slide(models.Model):
    image_url = models.TextField(blank=True, null=True)
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=500, blank=True)
    link = models.CharField(max_length=500, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Slide'
        verbose_name_plural = 'Slides'

    def __str__(self):
        return self.title or f'Slide {self.id}'

class StoreSettings(models.Model):
    free_delivery_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, default=100.00,
        help_text="Orders above this amount get free delivery."
    )
    delivery_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=50.00,
        help_text="Standard delivery charge for orders below the threshold."
    )

    class Meta:
        verbose_name = 'Store Setting'
        verbose_name_plural = 'Store Settings'

    def save(self, *args, **kwargs):
        # Ensure there is only one instance
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Store Settings"