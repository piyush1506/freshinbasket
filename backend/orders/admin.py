from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Q
from .models import Order, OrderItem, Cart, CartItem, DeliveryAssignment, Review, DeliveryCluster, DeliverySlot, OrderProduct


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
    extra = 1
    max_num = 1
    can_delete = True
    readonly_fields = ('assigned_at', 'delivered_at')

    def get_extra(self, request, obj=None, **kwargs):
        """Show extra form only if order has no assignment yet."""
        if obj and hasattr(obj, 'delivery_assignment'):
            return 0
        return self.extra

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Restrict delivery_boy dropdown to only DELIVERY role users."""
        if db_field.name == "delivery_boy":
            from django.contrib.auth import get_user_model
            User = get_user_model()
            kwargs["queryset"] = User.objects.filter(role='DELIVERY')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class PrintOrderMixin:
    actions = ['print_selected_orders']

    @admin.action(description='Print Selected Orders')
    def print_selected_orders(self, request, queryset):
        from django.shortcuts import render
        orders = queryset.prefetch_related('items')
        return render(request, 'admin/print_multiple_orders_card.html', {'orders': orders})

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<path:object_id>/print/', self.admin_site.admin_view(self.print_card_view), name=f'{self.model._meta.app_label}_{self.model._meta.model_name}_print_card'),
        ]
        return custom_urls + urls

    def print_card_view(self, request, object_id):
        from django.shortcuts import get_object_or_404, render
        order = get_object_or_404(self.model, pk=object_id)
        return render(request, 'admin/print_order_card.html', {'order': order})

    def print_action(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        if obj.pk:
            url = reverse(f'admin:{self.model._meta.app_label}_{self.model._meta.model_name}_print_card', args=[obj.pk])
            return format_html('<a class="button" href="{}" style="background:#417690; color:white; padding:5px 10px; border-radius:4px; text-decoration:none; font-weight:bold;">Print</a>', url)
        return "-"
    print_action.short_description = "Print"


@admin.register(Order)
class OrderAdmin(PrintOrderMixin, admin.ModelAdmin):

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
        'is_paid', 'payment_method', 'assigned_to', 'delivery_address_short', 'created_at', 'print_action'
    )
    list_filter = ('status', 'is_paid', 'created_at', assignment_status)
    list_editable = ('status',)
    search_fields = ('id', 'order_number', 'customer__username', 'customer__email')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'total_amount', 'print_action')
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

@admin.register(OrderProduct)
class OrderProductAdmin(PrintOrderMixin, admin.ModelAdmin):
    change_list_template = "admin/orders/orderproduct/change_list.html"
    list_display = ('order_number', 'customer', 'status', 'payment_method')
    list_filter = ('payment_method', 'status')
    search_fields = ('order_number', 'customer__username', 'delivery_address')
    list_per_page = 20

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer').prefetch_related('items')

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
        verbose_name = "Delivery Tracker (Orders)"
        verbose_name_plural = "Delivery Tracker (Orders)"


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(PrintOrderMixin, admin.ModelAdmin):
    list_display = (
        'order_number', 'customer', 'short_address', 'status',
        'delivery_boy_name', 'is_paid', 'created_at', 'print_action'
    )
    list_filter = ('status', OrderAdmin.assignment_status, 'is_paid', 'created_at')
    inlines = [DeliveryAssignmentInline]
    search_fields = ('id', 'order_number', 'customer__username', 'customer__email')
    readonly_fields = ('print_action',)
    ordering = ('-created_at',)

    def short_address(self, obj):
        if not obj.delivery_address:
            return '-'
        return obj.delivery_address[:40] + '...' if len(obj.delivery_address) > 40 else obj.delivery_address
    short_address.short_description = 'Delivery Address'

    def delivery_boy_name(self, obj):
        try:
            assignment = obj.delivery_assignment
            from django.utils.html import format_html
            return format_html(
                '<span style="color:green; font-weight:bold;">✅ {}</span>',
                assignment.delivery_boy.username
            )
        except DeliveryAssignment.DoesNotExist:
            from django.utils.safestring import mark_safe
            return mark_safe('<span style="color:red; font-weight:bold;"> Unassigned</span>')
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

@admin.register(DeliveryCluster)
class DeliveryClusterAdmin(admin.ModelAdmin):
    list_display = ('cluster_number', 'delivery_slot', 'assignment_date', 'assigned_delivery_boy')
    list_filter = ('delivery_slot', 'assignment_date')

@admin.register(DeliverySlot)
class DeliverySlotAdmin(admin.ModelAdmin):
    list_display = ('sort_order', 'name', 'display_label', 'active_range', 'order_start_time', 'order_cutoff_time', 'delivery_start_time', 'delivery_end_time', 'assignment_time', 'cleanup_time', 'is_active')
    list_display_links = ('name',)
    list_editable = ('sort_order', 'is_active')
    list_filter = ('is_active',)
    ordering = ('sort_order', 'order_cutoff_time')
    fields = (
        'name', 'display_label',
        ('order_start_time', 'order_cutoff_time'), ('active_range_display',),
        'delivery_start_time', 'delivery_end_time',
        ('assignment_hour', 'assignment_minute'),
        ('cleanup_hour', 'cleanup_minute'),
        'is_active', 'sort_order',
    )
    readonly_fields = ('active_range_display',)

    def assignment_time(self, obj):
        return f"{obj.assignment_hour:02d}:{obj.assignment_minute:02d}"
    assignment_time.short_description = 'Auto-Assign'

    def cleanup_time(self, obj):
        return f"{obj.cleanup_hour:02d}:{obj.cleanup_minute:02d}"
    cleanup_time.short_description = 'Cleanup'

    def active_range(self, obj):
        start = obj.order_start_time.strftime('%I:%M %p')
        end = obj.order_cutoff_time.strftime('%I:%M %p')
        return f"{start} → {end}"
    active_range.short_description = 'Orders from → until'

    def active_range_display(self, obj):
        start = obj.order_start_time.strftime('%I:%M %p')
        end = obj.order_cutoff_time.strftime('%I:%M %p')
        return f"Orders placed from {start} to {end} → gets this slot"
    active_range_display.short_description = 'When does this slot apply?'


@admin.register(DeliveryAssignment)
class DeliveryAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'delivery_boy', 'cluster', 'assigned_at', 'delivered_at')
    list_filter = ('assigned_at', 'delivered_at', 'delivery_boy')
    search_fields = ('order__order_number', 'delivery_boy__username')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Restrict delivery_boy dropdown to only DELIVERY role users."""
        if db_field.name == "delivery_boy":
            from django.contrib.auth import get_user_model
            User = get_user_model()
            kwargs["queryset"] = User.objects.filter(role='DELIVERY')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)