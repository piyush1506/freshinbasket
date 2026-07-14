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


class Section(models.Model):
    """Top-level grouping (e.g. Fresh, Organic). Categories and Products belong to a Section."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, default='', help_text="Emoji or icon name for the tab (e.g. 🥬)")
    image = models.ImageField(upload_to='sections/', blank=True, null=True)
    product_label = models.CharField(max_length=50, blank=True, default='', help_text="Custom badge to show on all products in this section (e.g. 'Organic' or 'Keto')")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower = first)")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        orig_slug = self.slug
        counter = 1
        while Section.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
            self.slug = f"{orig_slug}-{counter}"
            counter += 1
        super().save(*args, **kwargs)


class Category(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='categories', null=True, blank=True)
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
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    categories = models.ManyToManyField(Category, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Tax percentage (e.g. 5, 12, 18)")
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, help_text="Unit of measurement (e.g. kg, piece, 250g)")
    is_active = models.BooleanField(default=True, help_text="Uncheck to hide product from the frontend without deleting it")
    image_url = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mrp = models.DecimalField(
        max_digits=10,
        decimal_places=2, null=True, blank=True,
        help_text="Maximum Retail Price"
    )
    order_step = models.DecimalField(
        max_digits=6, decimal_places=2, default=1,
        help_text="Quantity step for +/- buttons (e.g. 1 for 1 piece/kg, 0.25 for 250g steps)"
    )
    min_order_qty = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="Minimum order quantity (0 = no minimum, first click adds one step)"
    )

    def __str__(self):
        return self.name

    @property
    def discount_amount(self):
        if self.mrp and self.mrp > self.price:
            return self.mrp - self.price
        return 0

    @property
    def discount_percentage(self):
        if self.mrp and self.mrp > self.price:
            return round(((self.mrp - self.price)/(self.mrp))*100)
        return 0        


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        orig_slug = self.slug
        counter = 1
        while Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
            self.slug = f"{orig_slug}-{counter}"
            counter += 1
        from django.core.cache import cache
        cache.clear()
        try:
            search_version = cache.get('product_search_version', 1)
            cache.set('product_search_version', search_version + 1, timeout=None)
        except Exception:
            pass
        
        super().save(*args, **kwargs)


class Slide(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='slides', null=True, blank=True)
    image_url = models.TextField(blank=True, null=True)
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=500, blank=True)
    tag = models.CharField(max_length=100, blank=True, default='Organic')
    link = models.CharField(max_length=500, blank=True, help_text="First button link (Shop Now)")
    button_text = models.CharField(max_length=100, blank=True, default='Shop Now')
    link_two = models.CharField(max_length=500, blank=True, help_text="Second button link (View Offers)")
    button_text_two = models.CharField(max_length=100, blank=True, default='View Offers')
    order = models.PositiveIntegerField(default=0)
    text_color = models.CharField(max_length=50, blank=True, null=True, help_text="Optional custom hex color for text, e.g. #FFFFFF or #1A1A1A")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Slide'
        verbose_name_plural = 'Slides'

    def __str__(self):
        return self.title or f'Slide {self.id}'

class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']
        verbose_name = 'Wishlist Item'
        verbose_name_plural = 'Wishlist Items'

    def __str__(self):
        return f"{self.user.email} - {self.product.name}"


class SubProduct(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='subproducts')
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    image_url = models.ImageField(upload_to='subproducts/', blank=True, null=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.name}"

    @property
    def discount_amount(self):
        if self.mrp and self.mrp > self.price:
            return self.mrp - self.price
        return 0

    @property
    def discount_percentage(self):
        if self.mrp and self.mrp > self.price:
            return round(((self.mrp - self.price) / self.mrp) * 100)
        return 0

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Sub Product'
        verbose_name_plural = 'Sub Products'


class StoreSettings(models.Model):
    free_delivery_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, default=100.00,
        help_text="Orders above this amount get free delivery."
    )
    delivery_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=50.00,
        help_text="Standard delivery charge for orders below the threshold."
    )
    max_delivery_radius = models.DecimalField(
        max_digits=5, decimal_places=2, default=7.00,
        help_text="Maximum delivery radius in km. Orders beyond this distance will be blocked."
    )
    is_announcement_active = models.BooleanField(
        default=False,
        help_text="Check this to display the announcement banner on the home page."
    )
    announcement_message = models.TextField(
        blank=True, null=True,
        help_text="Text to display in the announcement banner. e.g., 'We deliver vegetables from 7am to 12pm...'"
    )
    announcement_bg_color = models.CharField(
        max_length=20, default="#0c831f",
        help_text="Background color of the banner (hex code or CSS color, e.g., #0c831f or red)"
    )
    announcement_text_color = models.CharField(
        max_length=20, default="#ffffff",
        help_text="Text color of the banner (e.g., #ffffff or white)"
    )
    free_delivery_first_order = models.BooleanField(
        default=True,
        help_text="Enable free delivery for the user's first order."
    )
    is_free_dhaniya_active = models.BooleanField(
        default=False,
        help_text="Toggle free dhaniya offer on or off."
    )
    free_dhaniya_threshold_kg = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.00,
        help_text="Minimum order weight in kg to get free dhaniya."
    )
    admin_notification_email = models.CharField(
        max_length=500,
        blank=True, 
        null=True,
        help_text="Comma-separated emails to receive new order alerts (e.g. admin1@gmail.com, admin2@gmail.com)"
    )
    admin_notification_phone = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Comma-separated phone numbers to receive admin Push Notifications (e.g. 9876543210, 9123456789)"
    )

    class Meta:
        verbose_name = 'Store Setting'
        verbose_name_plural = 'Store Settings'

    def save(self, *args, **kwargs):
        # Ensure there is only one instance
        self.pk = 1
        super().save(*args, **kwargs)
        from django.core.cache import cache
        cache.delete('store_settings')

    @classmethod
    def get_settings(cls):
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create()
        return obj

    def __str__(self):
        return "Store Settings"