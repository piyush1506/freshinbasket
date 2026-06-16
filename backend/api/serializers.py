import cloudinary.uploader
from rest_framework import serializers
from users.models import User
from store.models import Category, Product, Slide, ContactQuery
from orders.models import Order, OrderItem, DeliveryAssignment, Cart, CartItem
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
import re


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'address', 'avatar')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'confirm_password', 'email', 'phone_number', 'address')

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Username cannot be empty')
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters')
        if not re.match(r'^[\w\s\-]+$', value):
            raise serializers.ValidationError(
                'Username can only contain letters, numbers, spaces, underscores, and hyphens.'
            )
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists')
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain at least one number')
        try:
            django_validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number') or None,
            address=validated_data.get('address', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


def get_transformed_cloudinary_url(url, width=None):
    if not url:
        return None
    
    # Add Cloudinary transformations for optimal quality
    if 'cloudinary.com' in url and '/upload/' in url:
        parts = url.split('/upload/', 1)
        if len(parts) == 2:
            # q_auto,f_auto: Automatic quality and format
            # e_sharpen:60: Increases clarity of edges (essential for upscaling)
            # e_improve: AI-based color and contrast enhancement
            transformation = "q_auto,f_auto,e_sharpen:60,e_improve"
            if width:
                transformation = f"c_scale,w_{width},{transformation}"
            return f"{parts[0]}/upload/{transformation}/{parts[1]}"
    
    return url


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'slug', 'image', 'image_url')

    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            return get_transformed_cloudinary_url(obj.image.url, width=600)
        return None


class ProductSerializer(serializers.ModelSerializer):
    category_names = serializers.SerializerMethodField()
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description', 'price', 'stock',
            'image', 'image_url', 'created_at', 'updated_at',
            'categories', 'category_names',
        )

    def get_image_url(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            url = obj.image_url.url
        else:
            url = obj.image_url
        
        return get_transformed_cloudinary_url(url, width=800)

    def get_category_names(self, obj):
        return [c.name for c in obj.categories.all()]

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        image = validated_data.pop('image', None)
        if image:
            upload_result = cloudinary.uploader.upload(
                image, folder='freshinbasket/products',
                resource_type='image',
                allowed_formats=['jpg', 'png', 'webp', 'gif'],
                quality='auto',  # Automatic quality optimization
                fetch_format='auto',  # Automatic format selection
                flags='progressive',  # Progressive JPEG for better perceived loading
            )
            validated_data['image_url'] = upload_result['secure_url']
        product = super().create(validated_data)
        if categories:
            product.categories.set(categories)
        return product

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        image = validated_data.pop('image', None)
        if image:
            upload_result = cloudinary.uploader.upload(
                image, folder='freshinbasket/products',
                resource_type='image',
                allowed_formats=['jpg', 'png', 'webp', 'gif'],
                quality='auto',  # Automatic quality optimization
                fetch_format='auto',  # Automatic format selection
                flags='progressive',  # Progressive JPEG for better perceived loading
            )
            validated_data['image_url'] = upload_result['secure_url']
        product = super().update(instance, validated_data)
        if categories is not None:
            product.categories.set(categories)
        return product


class SearchProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'stock', 'image_url')

    def get_image_url(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            return get_transformed_cloudinary_url(obj.image_url.url, width=200)
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source='customer.username')

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'customer', 'customer_name', 'status',
            'total_amount', 'delivery_address', 'created_at',
            'delivery_latitude', 'delivery_longitude', 'delivery_slot',
            'is_paid', 'payment_method', 'items'
        )


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    order_id = serializers.ReadOnlyField(source='order.id')
    delivery_boy_name = serializers.ReadOnlyField(source='delivery_boy.username')

    class Meta:
        model = DeliveryAssignment
        fields = (
            'id', 'order', 'order_id', 'delivery_boy',
            'delivery_boy_name', 'assigned_at', 'delivered_at', 'notes'
        )


class CartItemSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='product.name')
    price = serializers.ReadOnlyField(source='product.price')
    image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    def get_image(self, obj):
        if obj.product.image_url and hasattr(obj.product.image_url, 'url'):
            return get_transformed_cloudinary_url(obj.product.image_url.url, width=100)
        return None

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'name', 'price', 'image', 'quantity', 'total_price')

    def get_total_price(self, obj):
        return obj.quantity * obj.product.price


class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150)

    class Meta:
        model = User
        fields = ('username', 'email', 'phone_number', 'address', 'avatar')

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Username cannot be empty.')
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters.')
        if not re.match(r'^[\w\s\-]+$', value):
            raise serializers.ValidationError(
                'Username can only contain letters, numbers, spaces, underscores, and hyphens.'
            )
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use')
        return value


class ContactQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactQuery
        fields = ('id', 'name', 'email', 'message', 'response', 'responded_at', 'created_at')
        read_only_fields = ('response', 'responded_at', 'created_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
            validated_data.setdefault('name', request.user.username)
            validated_data.setdefault('email', request.user.email)
        return super().create(validated_data)


class SlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Slide
        fields = ('id', 'image_url', 'title', 'subtitle', 'link', 'order', 'is_active', 'created_at')
        read_only_fields = ('created_at',)

    def get_image_url(self, obj):
        return get_transformed_cloudinary_url(obj.image_url)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    delivery_charge = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    free_delivery_threshold = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'created_at', 'items', 'subtotal', 'delivery_charge', 'grand_total', 'free_delivery_threshold')

    def get_subtotal(self, obj):
        return sum(item.quantity * item.product.price for item in obj.items.all())

    def get_delivery_charge(self, obj):
        subtotal = self.get_subtotal(obj)
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        if subtotal > 0 and subtotal <= settings_obj.free_delivery_threshold:
            return settings_obj.delivery_charge
        return 0

    def get_grand_total(self, obj):
        return self.get_subtotal(obj) + self.get_delivery_charge(obj)

    def get_free_delivery_threshold(self, obj):
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        return settings_obj.free_delivery_threshold

class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        from store.models import StoreSettings
        model = StoreSettings
        fields = ('free_delivery_threshold', 'delivery_charge')
