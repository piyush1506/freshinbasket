from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Q
from .models import Order, OrderItem, Cart, CartItem, DeliveryAssignment, Review


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'weight', 'unit_price', 'total_price')
    can_delete = False

    def weight(self, obj):
        return f"{obj.quantity} kg"
    weight.short_description = "Weight"


class DeliveryAssignmentInline(admin.StackedInline):
    model = DeliveryAssignment
    extra = 1          # Shows one blank row so admin can assign quickly
    can_delete = True
    readonly_fields = ('assigned_at', 'delivered_at')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Restrict delivery_boy dropdown to only DELIVERY role users."""
        if db_field.name == "delivery_boy":
            from django.contrib.auth import get_user_model
            User = get_user_model()
            kwargs["queryset"] = User.objects.filter(role='DELIVERY')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    class assignment_status(admin.SimpleListFilter):
        title = 'Assignment'
        parameter_name = 'assignment'

        def lookups(self, request, model_admin):
            return (
                ('assigned', 'Assigned'),
                ('unassigned', 'Unassigned'),
            )

        def queryset(self, request, queryset):
            if self.value() == 'assigned':
                return queryset.filter(delivery_assignment__isnull=False)
            if self.value() == 'unassigned':
                return queryset.filter(delivery_assignment__isnull=True)
            return queryset

    list_display = (
        'order_number', 'customer', 'status', 'total_amount',
        'is_paid', 'payment_method', 'assigned_to', 'delivery_address_short', 'created_at'
    )
    list_filter = ('status', 'is_paid', 'created_at', assignment_status)
    list_editable = ('status',)
    search_fields = ('order_number', 'customer__username', 'customer__email')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'total_amount')
    ordering = ('-created_at',)
    inlines = [OrderItemInline, DeliveryAssignmentInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('delivery_assignment', 'delivery_assignment__delivery_boy')

    def delivery_address_short(self, obj):
        if not obj.delivery_address:
            return '-'
        return obj.delivery_address[:40] + '...' if len(obj.delivery_address) > 40 else obj.delivery_address
    delivery_address_short.short_description = 'Address'

    def assigned_to(self, obj):
        """Show assigned delivery boy or a red 'Unassigned' badge."""
        try:
            assignment = obj.delivery_assignment
            return format_html(
                '<span style="color:green; font-weight:bold;">✅ {}</span>',
                assignment.delivery_boy.username
            )
        except DeliveryAssignment.DoesNotExist:
            from django.utils.safestring import mark_safe
            return mark_safe('<span style="color:red; font-weight:bold;"> Unassigned</span>')
    assigned_to.short_description = 'Delivery Boy'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product_name', 'weight', 'unit_price', 'total_price')
    search_fields = ('product_name', 'order__order_number')

    def weight(self, obj):
        return f"{obj.quantity} kg"
    weight.short_description = "Weight"

class CartItemsInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('product', 'weight')
    can_delete = False

    def weight(self, obj):
        return f"{obj.quantity} kg"
    weight.short_description = "Weight"

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'item_count', 'created_at', 'updated_at')
    search_fields = ('user__username',)
    inlines = [CartItemsInline]

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items in cart'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart_folder','product','weight')
    search_fields = ('cart__user__username','product__name')
    ordering = ('cart__user__username','product__name')

    def weight(self, obj):
        return f"{obj.quantity} kg"
    weight.short_description = "Weight"

    list_filter = ('cart',)
   
    def cart_folder(self, obj):
        # Creates a clickable link that filters the page to only show items for this cart
        url = f"?cart__id__exact={obj.cart.id}"
        from django.utils.html import format_html
        return format_html('<a href="{}" style="font-weight:bold; color:#447e9b;"> Items of {}</a>', url, obj.cart.user.username)
    cart_folder.short_description = 'Cart (Click to Filter)'


class DeliveryOrder(Order):
    class Meta:
        proxy = True
        verbose_name = "Delivery Assignment"
        verbose_name_plural = "Delivery Assignments"


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'customer', 'short_address', 'status',
        'delivery_boy_name', 'is_paid', 'created_at'
    )
    list_filter = ('status', 'is_paid', 'created_at')
    search_fields = ('order_number', 'customer__username', 'customer__email')
    ordering = ('-created_at',)

    def short_address(self, obj):
        if not obj.delivery_address:
            return '-'
        return obj.delivery_address[:40] + '...' if len(obj.delivery_address) > 40 else obj.delivery_address
    short_address.short_description = 'Delivery Address'

    def delivery_boy_name(self, obj):
        try:
            return obj.delivery_assignment.delivery_boy.username
        except DeliveryAssignment.DoesNotExist:
            return '-'
    delivery_boy_name.short_description = 'Delivery Boy'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'customer', 'delivery_assignment', 'delivery_assignment__delivery_boy'
        )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'user__email', 'order__order_number')
    ordering = ('-created_at',)