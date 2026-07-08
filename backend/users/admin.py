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
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role=User.Role.DELIVERY)
