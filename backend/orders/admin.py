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


from django import forms

class BulkAssignForm(forms.Form):
    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput)
    delivery_boy = forms.ModelChoiceField(
        queryset=None,
        label="Select Delivery Boy",
        required=True
    )
    group_name = forms.CharField(
        label="Group Name (Optional)",
        required=False,
        help_text="e.g. '26 July 2026 11:00 clock group'. Used for grouping in the app."
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.fields['delivery_boy'].queryset = User.objects.filter(role='DELIVERY')


class PrintOrderMixin:
    actions = ['print_selected_orders', 'assign_orders_bulk']

    @admin.action(description='Print Selected Orders')
    def print_selected_orders(self, request, queryset):
        from django.shortcuts import render
        orders = queryset.prefetch_related('items')
        return render(request, 'admin/print_multiple_orders_card.html', {'orders': orders})

    @admin.action(description='Assign selected orders to Delivery Boy')
    def assign_orders_bulk(self, request, queryset):
        from django.shortcuts import render
        from django.http import HttpResponseRedirect
        from django.contrib import messages

        if 'apply' in request.POST:
            form = BulkAssignForm(request.POST)
            if form.is_valid():
                delivery_boy = form.cleaned_data['delivery_boy']
                group_name = form.cleaned_data.get('group_name', '')
                
                # Determine slot from first order, or use a default
                first_order = queryset.first()
                slot = first_order.delivery_slot if first_order and first_order.delivery_slot else "Manual Group"

                # Create manual DeliveryCluster
                cluster = DeliveryCluster.objects.create(
                    delivery_slot=slot,
                    group_name=group_name if group_name else f"Manual Admin Group - {delivery_boy.username}",
                    assigned_delivery_boy=delivery_boy,
                    cluster_number=1,
                )

                count = 0
                for order in queryset:
                    # Update or create assignment
                    DeliveryAssignment.objects.update_or_create(
                        order=order,
                        defaults={
                            'delivery_boy': delivery_boy, 
                            'cluster': cluster,
                            'notes': 'Manually assigned by Admin in bulk.'
                        }
                    )
                    count += 1
                self.message_user(request, f"Successfully assigned {count} orders to {delivery_boy.username} as a group.", messages.SUCCESS)
                from django.urls import reverse
                changelist_url = reverse(f'admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist')
                return HttpResponseRedirect(changelist_url)
        else:
            form = BulkAssignForm(initial={'_selected_action': request.POST.getlist(admin.helpers.ACTION_CHECKBOX_NAME)})

        return render(
            request,
            'admin/bulk_assign_orders.html',
            context={
                'orders': queryset,
                'form': form,
                'opts': self.model._meta,
                'title': 'Bulk Assign Orders'
            }
        )

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




@admin.register(OrderProduct)
class OrderProductAdmin(PrintOrderMixin, admin.ModelAdmin):
    change_list_template = "admin/orders/orderproduct/change_list.html"
    list_display = ('order_number', 'customer', 'status', 'payment_method')
    list_filter = ('payment_method', 'status')
    search_fields = ('order_number', 'customer__username', 'delivery_address')
    list_per_page = 20

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer').prefetch_related('items')




class DeliveryOrder(Order):
    class Meta:
        proxy = True
        verbose_name = "Delivery Tracker (Orders)"
        verbose_name_plural = "Delivery Tracker (Orders)"


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(PrintOrderMixin, admin.ModelAdmin):
    list_display = (
        'order_number', 'customer', 'short_address', 'status',
        'delivery_boy_name', 'live_location_link', 'is_paid', 'created_at', 'print_action'
    )
    list_filter = ('status', OrderAdmin.assignment_status, 'is_paid', 'created_at')
    inlines = [DeliveryAssignmentInline]
    search_fields = ('id', 'order_number', 'customer__username', 'customer__email')
    readonly_fields = ('print_action',)
    ordering = ('-created_at',)

    def live_location_link(self, obj):
        try:
            assignment = obj.delivery_assignment
            if assignment and assignment.delivery_boy:
                from orders.delivery.models import DeliveryLocation
                loc = DeliveryLocation.objects.filter(delivery_boy=assignment.delivery_boy).first()
                if loc:
                    url = f"https://www.openstreetmap.org/?mlat={loc.latitude}&mlon={loc.longitude}#map=17/{loc.latitude}/{loc.longitude}"
                    return format_html('<a href="{}" target="_blank" class="button" style="background:#5b80b2; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">📍 Map</a>', url)
        except Exception:
            pass
        return "-"
    live_location_link.short_description = 'Live Location'

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
    change_list_template = "admin/orders/deliveryassignment/change_list.html"
    list_display = ('id', 'order', 'delivery_boy', 'cluster', 'assigned_at', 'delivered_at', 'live_location_link')
    list_filter = ('assigned_at', 'delivered_at', 'delivery_boy')
    search_fields = ('order__order_number', 'delivery_boy__username')

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('manual-assign/', self.admin_site.admin_view(self.manual_assign_view), name='orders_deliveryassignment_manual_assign'),
        ]
        return custom_urls + urls

    def manual_assign_view(self, request):
        from django.shortcuts import render
        from django.http import HttpResponseRedirect
        from django.contrib import messages
        from orders.models import Order, DeliveryCluster, DeliveryAssignment
        from django.contrib.auth import get_user_model
        
        User = get_user_model()

        if request.method == 'POST':
            order_ids = request.POST.getlist('order_ids[]')
            group_name = request.POST.get('group_name', '').strip()
            delivery_boy_id = request.POST.get('delivery_boy_id')

            if not order_ids:
                self.message_user(request, "Please select at least one order.", level=messages.ERROR)
            elif not delivery_boy_id:
                self.message_user(request, "Please select a delivery boy.", level=messages.ERROR)
            else:
                delivery_boy = User.objects.filter(id=delivery_boy_id).first()
                if delivery_boy:
                    orders = Order.objects.filter(id__in=order_ids)
                    if orders.exists():
                        first_order = orders.first()
                        slot = first_order.delivery_slot if first_order.delivery_slot else "Manual Group"

                        cluster = DeliveryCluster.objects.create(
                            delivery_slot=slot,
                            group_name=group_name if group_name else f"Manual Assign - {delivery_boy.username}",
                            assigned_delivery_boy=delivery_boy,
                            cluster_number=1,
                        )

                        count = 0
                        for order in orders:
                            DeliveryAssignment.objects.update_or_create(
                                order=order,
                                defaults={
                                    'delivery_boy': delivery_boy, 
                                    'cluster': cluster,
                                    'notes': 'Manually assigned via custom view.'
                                }
                            )
                            count += 1
                        
                        self.message_user(request, f"Successfully assigned {count} orders to {delivery_boy.username} under group '{cluster.group_name}'.", messages.SUCCESS)
                        return HttpResponseRedirect(request.path)
                    else:
                        self.message_user(request, "Selected orders could not be found.", level=messages.ERROR)

        unassigned_orders = Order.objects.filter(delivery_assignment__isnull=True).exclude(status='CANCELLED').order_by('-created_at')
        delivery_boys = User.objects.filter(role='DELIVERY').order_by('username')
        recent_groups = DeliveryCluster.objects.prefetch_related('assignments__order').all().order_by('-id')[:6]
        
        context = dict(
            self.admin_site.each_context(request),
            title="Manual Assign Orders",
            unassigned_orders=unassigned_orders,
            delivery_boys=delivery_boys,
            recent_groups=recent_groups,
            opts=self.model._meta,
        )

        return render(request, "admin/orders/deliveryassignment/manual_assign.html", context)

    def live_location_link(self, obj):
        if obj.delivery_boy:
            from orders.delivery.models import DeliveryLocation
            loc = DeliveryLocation.objects.filter(delivery_boy=obj.delivery_boy).first()
            if loc:
                url = f"https://www.openstreetmap.org/?mlat={loc.latitude}&mlon={loc.longitude}#map=17/{loc.latitude}/{loc.longitude}"
                return format_html('<a href="{}" target="_blank" class="button" style="background:#5b80b2; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">📍 Map</a>', url)
        return "-"
    live_location_link.short_description = 'Live Location'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Restrict delivery_boy dropdown to only DELIVERY role users."""
        if db_field.name == "delivery_boy":
            from django.contrib.auth import get_user_model
            User = get_user_model()
            kwargs["queryset"] = User.objects.filter(role='DELIVERY')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)