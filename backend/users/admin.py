from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, DeliveryProfile, DeliveryBoy

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Fields', {'fields': ('role', 'phone_number', 'address')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Extra Fields', {'fields': ('role', 'phone_number', 'address')}),
    )

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
