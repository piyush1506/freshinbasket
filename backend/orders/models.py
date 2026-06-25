from django.db import models
from django.conf import settings
from store.models import Product


# =========================
# CART MODEL
# =========================
class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='cart',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"cart for {self.user.username}"


# =========================
# CART ITEM MODEL
# =========================
class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        related_name='items',
        on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


# =========================
# ORDER MODEL
# =========================
class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='orders',
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    delivery_address = models.TextField()
    delivery_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True
    )
    delivery_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    delivery_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )

    class PaymentMethod(models.TextChoices):
        COD = 'COD', 'Cash on Delivery'
        ONLINE = 'ONLINE', 'Online Payment'

    is_paid = models.BooleanField(default=False)

    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.ONLINE
    )

    delivery_slot = models.CharField(max_length=20, blank=True, null=True)

    order_number = models.CharField(max_length=20, unique=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            import uuid
            self.order_number = f"HF-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} - {self.total_amount}"


# =========================
# ORDER ITEM MODEL
# =========================
class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name='items',
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    product_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_name = models.CharField(max_length=50, blank=True, default='kg', help_text="Unit label at time of order")

    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        
      

# =========================
# DELIVERY CLUSTER
# =========================
class DeliveryCluster(models.Model):
    assignment_date = models.DateField(auto_now_add=True)
    delivery_slot = models.CharField(max_length=20)
    cluster_number = models.PositiveIntegerField()
    center_latitude = models.DecimalField(max_digits=10, decimal_places=6)
    center_longitude = models.DecimalField(max_digits=10, decimal_places=6)
    assigned_delivery_boy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assigned_clusters',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Cluster {self.cluster_number} - {self.delivery_slot}"


# =========================
# DELIVERY ASSIGNMENT
# =========================
class DeliveryAssignment(models.Model):
    order = models.OneToOneField(
        Order,
        related_name='delivery_assignment',
        on_delete=models.CASCADE
    )

    delivery_boy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assignments',
        on_delete=models.CASCADE
    )

    cluster = models.ForeignKey(
        DeliveryCluster,
        related_name='assignments',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Assignment for Order {self.order.id} to {self.delivery_boy.username}"


# =========================
# REVIEW MODEL
# =========================
class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='reviews',
        on_delete=models.CASCADE
    )
    order = models.OneToOneField(
        Order,
        related_name='review',
        on_delete=models.CASCADE
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for Order {self.order.order_number} - {self.rating}★"