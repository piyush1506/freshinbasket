from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, Cart, CartItem, DeliveryAssignment


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
    list_display = (
        'order_number', 'customer', 'status', 'total_amount',
        'is_paid', 'payment_method', 'assigned_to', 'delivery_address_short', 'created_at'
    )
    list_filter = ('status', 'is_paid', 'created_at')
    list_editable = ('status',)
    search_fields = ('order_number', 'customer__username', 'customer__email')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'total_amount')
    ordering = ('-created_at',)
    inlines = [OrderItemInline, DeliveryAssignmentInline]

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


@admin.register(DeliveryAssignment)
class DeliveryAssignmentAdmin(admin.ModelAdmin):
    list_display = ('order', 'delivery_boy', 'is_delivered', 'assigned_at', 'delivered_at')
    list_filter = ('delivered_at', 'delivery_boy')
    search_fields = ('order__order_number', 'delivery_boy__username')
    readonly_fields = ('assigned_at',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Restrict delivery_boy dropdown to only DELIVERY role users."""
        if db_field.name == "delivery_boy":
            from django.contrib.auth import get_user_model
            User = get_user_model()
            kwargs["queryset"] = User.objects.filter(role='DELIVERY')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def is_delivered(self, obj):
        return obj.delivered_at is not None
    is_delivered.boolean = True
    is_delivered.short_description = 'Delivered'