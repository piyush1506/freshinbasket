from django.contrib import admin
from django.utils.html import format_html
from django.utils.timezone import now
from .models import Category, Product, Slide, ContactQuery, Unit


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'image_preview', 'product_count')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('image_preview',)
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'description')
        }),
        ('Image', {
            'fields': ('image', 'image_preview')
        }),
    )

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Total Products'

    def image_preview(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            return format_html('<img src="{}" style="max-height: 80px; max-width: 80px; border-radius: 8px;" />', obj.image.url)
        return 'No image'
    image_preview.short_description = 'Image'


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_list', 'discount_display','unit', 'price', 'tax_percentage', 'stock', 'mrp','stock_status', 'image_preview', 'created_at')
    list_editable = ('price', 'tax_percentage', 'mrp','stock')
    list_filter = ('categories', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'image_preview')
    filter_horizontal = ('categories',)
    fieldsets = (
        (None, {
            'fields': ('categories', 'name', 'slug', 'mrp','description', 'price', 'stock', 'tax_percentage', 'unit')
        }),
        ('Image', {
            'fields': ('image_url', 'image_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def category_list(self, obj):
        return ", ".join(c.name for c in obj.categories.all())
    category_list.short_description = 'Categories'

    def image_preview(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            return format_html('<img src="{}" style="max-height: 100px; max-width: 100px;" />', obj.image_url.url)
        return 'No image'
    image_preview.short_description = 'Image Preview'

    def stock_status(self, obj):
        if obj.stock == 0:
            return 'Out of stock'
        elif obj.stock < 10:
            return f'Low ({obj.stock})'
        return 'In stock'
    stock_status.short_description = 'Stock Status'

    def discount_display(self,obj):
        if obj.discount_percentage > 0:
            return f'{obj.discount_percentage}%OFF'
        return '-'
    discount_display.short_description = 'Discount'    
         


@admin.register(ContactQuery)
class ContactQueryAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'user_link', 'message_preview', 'has_response', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'message', 'response')
    readonly_fields = ('user', 'name', 'email', 'message', 'responded_at', 'created_at')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Customer', {
            'fields': ('user', 'name', 'email', 'message', 'created_at')
        }),
        ('Response', {
            'fields': ('response', 'responded_at')
        }),
    )

    def user_link(self, obj):
        if obj.user:
            from django.urls import reverse
            from django.utils.html import format_html
            url = reverse('admin:users_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        return '-'
    user_link.short_description = 'User'

    def message_preview(self, obj):
        return obj.message[:80] + '...' if len(obj.message) > 80 else obj.message
    message_preview.short_description = 'Message'

    def has_response(self, obj):
        return bool(obj.response)
    has_response.boolean = True
    has_response.short_description = 'Replied'

    def save_model(self, request, obj, form, change):
        if obj.response and not obj.responded_at:
            obj.responded_at = now()
        elif not obj.response:
            obj.responded_at = None
        super().save_model(request, obj, form, change)


@admin.register(Slide)
class SlideAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'image_preview', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
    readonly_fields = ('image_preview', 'created_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'subtitle', 'tag', 'order', 'is_active')
        }),
        ('Buttons', {
            'fields': (('link', 'button_text'), ('link_two', 'button_text_two')),
        }),
        ('Image', {
            'fields': ('image_url', 'image_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )

    def image_preview(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover; border-radius: 4px;" />', obj.image_url)
        return "No Image"
    image_preview.short_description = 'Image'

from .models import StoreSettings

@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'free_delivery_threshold', 'delivery_charge')
    
    def has_add_permission(self, request):
        # Prevent adding more than one instance
        if StoreSettings.objects.exists():
            return False
        return super().has_add_permission(request)
    
    def has_delete_permission(self, request, obj=None):
        return False
