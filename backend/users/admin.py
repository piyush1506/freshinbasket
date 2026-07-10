from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, DeliveryProfile, DeliveryBoy

class PlatformListFilter(admin.SimpleListFilter):
    title = 'Platform'
    parameter_name = 'platform'

    def lookups(self, request, model_admin):
        return (
            ('web', 'Web Users'),
            ('app', 'App Users'),
            ('both', 'Both (App & Web)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'app':
            return queryset.filter(fcm_tokens__isnull=False).distinct()
        if self.value() == 'web':
            return queryset.filter(fcm_tokens__isnull=True)
        if self.value() == 'both':
            return queryset.filter(fcm_tokens__isnull=False).distinct()
        return queryset


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    change_list_template = "admin/users/user/change_list.html"
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active', PlatformListFilter)
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Fields', {'fields': ('role', 'phone_number', 'address')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Extra Fields', {'fields': ('role', 'phone_number', 'address')}),
    )

    def changelist_view(self, request, extra_context=None):
        from django.utils import timezone
        from orders.models import Order
        
        today = timezone.localtime().date()
        extra_context = extra_context or {}
        
        extra_context['today_new_customers'] = User.objects.filter(date_joined__date=today, role=User.Role.CUSTOMER).count()
        extra_context['active_customers'] = Order.objects.filter(customer__role=User.Role.CUSTOMER).values('customer').distinct().count()
        extra_context['ordered_today_customers'] = Order.objects.filter(created_at__date=today).values('customer').distinct().count()
        extra_context['total_customers'] = User.objects.filter(role=User.Role.CUSTOMER).count()
        
        return super().changelist_view(request, extra_context=extra_context)

class DeliveryProfileInline(admin.StackedInline):
    model = DeliveryProfile
    can_delete = False

CustomUserAdmin.inlines = [DeliveryProfileInline]

@admin.register(DeliveryBoy)
class DeliveryBoyAdmin(CustomUserAdmin):
    list_display = ('username', 'email', 'phone_number', 'role')

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role=User.Role.DELIVERY)

    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        if object_id:
            from django.utils import timezone
            from django.db.models import Sum
            from orders.models import DeliveryAssignment

            delivery_boy = self.get_object(request, object_id)
            if delivery_boy:
                now = timezone.localtime()
                today = now.date()
                week_start = today - timezone.timedelta(days=today.weekday())
                month_start = today.replace(day=1)
                
                assignments = DeliveryAssignment.objects.filter(delivery_boy=delivery_boy).select_related('order')
                
                def get_stats(date_kwargs_assigned, date_kwargs_delivered, date_kwargs_updated):
                    assigned = assignments.filter(**date_kwargs_assigned).count()
                    delivered = assignments.filter(order__status='DELIVERED', **date_kwargs_delivered).count()
                    cancelled = assignments.filter(order__status='CANCELLED', **date_kwargs_updated).count()
                    cod = assignments.filter(
                        order__status='DELIVERED', 
                        order__payment_method='COD',
                        **date_kwargs_delivered
                    ).aggregate(Sum('order__total_amount'))['order__total_amount__sum'] or 0

                    return {
                        'assigned': assigned,
                        'delivered': delivered,
                        'cancelled': cancelled,
                        'cod': cod
                    }

                today_kwargs = {'assigned_at__date': today}
                del_today_kwargs = {'delivered_at__date': today}
                upd_today_kwargs = {'order__updated_at__date': today}

                week_kwargs = {'assigned_at__date__gte': week_start}
                del_week_kwargs = {'delivered_at__date__gte': week_start}
                upd_week_kwargs = {'order__updated_at__date__gte': week_start}

                month_kwargs = {'assigned_at__date__gte': month_start}
                del_month_kwargs = {'delivered_at__date__gte': month_start}
                upd_month_kwargs = {'order__updated_at__date__gte': month_start}

                extra_context['today_stats'] = get_stats(today_kwargs, del_today_kwargs, upd_today_kwargs)
                extra_context['week_stats'] = get_stats(week_kwargs, del_week_kwargs, upd_week_kwargs)
                extra_context['month_stats'] = get_stats(month_kwargs, del_month_kwargs, upd_month_kwargs)
                extra_context['show_dashboard'] = True

        return super().change_view(request, object_id, form_url, extra_context=extra_context)
