from django.contrib import admin
from .models import FCMToken, DeviceToken


@admin.register(FCMToken)
class FCMTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'short_token', 'updated_at')
    list_filter = ('updated_at',)
    search_fields = ('user__phone_number', 'user__username', 'token')
    readonly_fields = ('created_at', 'updated_at')

    def short_token(self, obj):
        return obj.token[:30] + '...'
    short_token.short_description = 'Token (preview)'


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'platform', 'short_token', 'is_active', 'updated_at')
    list_filter = ('platform', 'is_active', 'updated_at')
    search_fields = ('user__phone_number', 'user__username', 'token')
    readonly_fields = ('created_at', 'updated_at')

    def short_token(self, obj):
        return obj.token[:30] + '...'
    short_token.short_description = 'Token (preview)'

