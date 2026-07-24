import datetime
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
    quantity = models.DecimalField(max_digits=8, decimal_places=3, default=1)

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
        UNDELIVERED = 'UNDELIVERED', 'Undelivered'

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

    cancellation_reason = models.TextField(blank=True, null=True)
    undelivered_reason = models.TextField(blank=True, null=True)

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

    delivery_slot = models.CharField(max_length=100, blank=True, null=True)
    delivery_slot_ref = models.ForeignKey(
        'DeliverySlot',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        help_text="FK reference for robust slot querying — survives label renames"
    )

    payment_id = models.CharField(max_length=100, blank=True, null=True, help_text="Razorpay payment ID for online payments")

    refund_id = models.CharField(max_length=100, blank=True, null=True, help_text="Razorpay refund ID")
    refund_status = models.CharField(max_length=50, blank=True, null=True, help_text="Refund status (e.g., PROCESSED, FAILED)")

    order_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    is_test_order = models.BooleanField(default=False, help_text="Test order created via admin without sending notifications")

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random
            while True:
                # Generate a 6-digit random number
                new_number = str(random.randint(100000, 999999))
                if not Order.objects.filter(order_number=new_number).exists():
                    self.order_number = new_number
                    break
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
    quantity = models.DecimalField(max_digits=8, decimal_places=3, default=1)
    unit_name = models.CharField(max_length=50, blank=True, default='kg', help_text="Unit label at time of order")

    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

class OrderProduct(Order):
    class Meta:
        proxy = True
        verbose_name = "OrderDetail Card"
        verbose_name_plural = "OrderDetail Cards"


class TestOrder(Order):
    class Meta:
        proxy = True
        verbose_name = "Test Order"
        verbose_name_plural = "Test Orders"


# =========================
# DELIVERY CLUSTER
# =========================
class DeliveryCluster(models.Model):
    assignment_date = models.DateField(auto_now_add=True)
    delivery_slot = models.CharField(max_length=100)
    group_name = models.CharField(max_length=255, blank=True, null=True)
    cluster_number = models.PositiveIntegerField(default=1)
    center_latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    center_longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
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


# =========================
# SCHEDULER LOCK
# =========================
class SchedulerLock(models.Model):
    """Database lock to prevent duplicate scheduler job execution across workers."""
    job_name = models.CharField(max_length=100, unique=True)
    locked_at = models.DateTimeField(auto_now_add=True)
    locked_by = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Scheduler Lock"
        verbose_name_plural = "Scheduler Locks"

    def __str__(self):
        return f"Lock: {self.job_name} by {self.locked_by}"


class DeliverySlot(models.Model):
    name = models.CharField(max_length=50, unique=True)
    display_label = models.CharField(
        max_length=50,
        help_text="e.g. '7 AM - 12 PM' — stored on orders"
    )
    order_start_time = models.TimeField(
        help_text="Orders placed FROM this time onwards get this slot. If start > cutoff, the range crosses midnight.",
        default=datetime.time(0, 0),
    )
    order_cutoff_time = models.TimeField(
        help_text="Orders placed BEFORE this time get this slot."
    )
    delivery_start_time = models.TimeField(
        help_text="When delivery boy actually starts delivering"
    )
    delivery_end_time = models.TimeField(
        help_text="When delivery window closes"
    )
    assignment_hour = models.PositiveSmallIntegerField(
        default=6,
        help_text="Hour (0-23) when auto-assignment runs"
    )
    assignment_minute = models.PositiveSmallIntegerField(
        default=30,
        help_text="Minute when auto-assignment runs"
    )
    cleanup_hour = models.PositiveSmallIntegerField(
        default=12,
        help_text="Hour (0-23) when cluster cleanup runs"
    )
    cleanup_minute = models.PositiveSmallIntegerField(
        default=30,
        help_text="Minute when cluster cleanup runs"
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Lower = processed first. Determines which slot is the 'first' (fallback after midnight)."
    )

    class Meta:
        ordering = ['sort_order', 'order_cutoff_time']
        verbose_name = "Delivery Slot"
        verbose_name_plural = "Delivery Slots"

    def __str__(self):
        return f"{self.name} ({self.display_label})"

    @classmethod
    def get_current_slot(cls):
        from django.utils import timezone
        now = timezone.localtime(timezone.now()).time()
        matching = []
        for slot in cls.objects.filter(is_active=True):
            start = slot.order_start_time
            end = slot.order_cutoff_time
            if start < end:
                if start <= now < end:
                    matching.append((slot, False))
            else:
                if now >= start:
                    matching.append((slot, True))
                elif now < end:
                    matching.append((slot, False))
        if not matching:
            return {'slot': None, 'is_next_day': True}
        matching.sort(key=lambda x: (x[0].sort_order, x[0].order_cutoff_time))
        best, is_next_day = matching[0]
        return {'slot': best, 'is_next_day': is_next_day}

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        self._sync_periodic_tasks()

    def _sync_periodic_tasks(self):
        """Update APScheduler jobs when slot config changes in admin."""
        try:
            from orders.scheduler import reload_slot_schedules
            reload_slot_schedules()
        except Exception:
            pass  # Scheduler may not be started yet (e.g., during migrations)