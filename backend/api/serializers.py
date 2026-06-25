import cloudinary.uploader
from rest_framework import serializers
from users.models import User
from store.models import Category, Product, Slide, ContactQuery, Unit, WishlistItem, SubProduct
from orders.models import Order, OrderItem, DeliveryAssignment, Cart, CartItem, Review
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
import re


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        phone_number = data.get('phone_number', '').strip()
        password = data.get('password', '')

        if email:
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            user = authenticate(username=email, password=password)
        elif phone_number:
            try:
                user_obj = User.objects.get(phone_number=phone_number)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            user = authenticate(username=phone_number, password=password)
        else:
            raise serializers.ValidationError('Email or phone number is required')

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
            email=validated_data.get('email') or None,
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
            transformation = "q_auto:best,f_auto,e_sharpen:60,e_improve"
            if width:
                transformation = f"c_limit,w_{width},{transformation}"
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


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ('id', 'name', 'slug')


class SubProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    unit = UnitSerializer(read_only=True)
    discount_amount = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()

    class Meta:
        model = SubProduct
        fields = (
            'id', 'name', 'price', 'mrp', 'stock', 'image_url', 'unit',
            'description', 'discount_amount', 'discount_percentage', 'created_at',
        )

    def get_image_url(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            url = obj.image_url.url
        else:
            url = obj.image_url
        return get_transformed_cloudinary_url(url, width=400)


class ProductSerializer(serializers.ModelSerializer):
    category_names = serializers.SerializerMethodField()
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField()
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, required=False, allow_null=True
    )
    discount_amount = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    subproducts = SubProductSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description', 'price', 'stock', 'mrp',
            'tax_percentage',
            'discount_percentage', 'discount_amount',
            'unit', 'unit_id',
            'image', 'image_url', 'created_at', 'updated_at',
            'categories', 'category_names', 'subproducts',
        )

    def get_image_url(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            url = obj.image_url.url
        else:
            url = obj.image_url
        
        return get_transformed_cloudinary_url(url, width=1200)

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
    unit = serializers.SerializerMethodField()
    discount_amount = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    mrp = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'stock', 'tax_percentage','mrp', 'discount_percentage','discount_amount','image_url', 'unit')

    def get_unit(self, obj):
        if obj.unit:
            return obj.unit.name
        return 'kg'

    def get_image_url(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            return get_transformed_cloudinary_url(obj.image_url.url, width=200)
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    tax_percentage = serializers.DecimalField(source='product.tax_percentage', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'quantity', 'unit_name', 'unit_price', 'total_price', 'tax_percentage')


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('id', 'order', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate(self, data):
        request = self.context.get('request')
        order = data.get('order')
        if order.customer != request.user:
            raise serializers.ValidationError('You can only review your own orders.')
        if order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError('You can only review delivered orders.')
        if Review.objects.filter(order=order).exists():
            raise serializers.ValidationError('You have already reviewed this order.')
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source='customer.username')
    review = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'customer', 'customer_name', 'status',
            'subtotal', 'delivery_charge', 'total_amount',
            'delivery_address', 'created_at',
            'delivery_latitude', 'delivery_longitude', 'delivery_slot',
            'is_paid', 'payment_method', 'items', 'review',
        )

    def get_review(self, obj):
        if hasattr(obj, 'review') and obj.review is not None:
            review = obj.review
            return {
                'id': review.id,
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at.isoformat(),
            }
        return None


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
    mrp = serializers.ReadOnlyField(source='product.mrp')
    discount_percentage = serializers.ReadOnlyField(source='product.discount_percentage')
    unit = serializers.SerializerMethodField()
    tax_percentage = serializers.DecimalField(source='product.tax_percentage', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'name', 'price', 'image', 'quantity', 'unit', 'mrp', 'discount_percentage', 'total_price', 'tax_percentage')

    def get_image(self, obj):
        if obj.product.image_url and hasattr(obj.product.image_url, 'url'):
            return get_transformed_cloudinary_url(obj.product.image_url.url, width=100)
        return None

    def get_unit(self, obj):
        if obj.product.unit:
            return obj.product.unit.name
        return 'kg'

    def get_total_price(self, obj):
        return obj.quantity * obj.product.price


class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, allow_blank=True, required=False)
    email = serializers.EmailField(allow_blank=True, allow_null=True, required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'phone_number', 'address', 'avatar')

    def validate_username(self, value):
        if not value:
            return None
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters.')
        if not re.match(r'^[\w\s\-]+$', value):
            raise serializers.ValidationError(
                'Username can only contain letters, numbers, spaces, underscores, and hyphens.'
            )
        return value

    def validate_email(self, value):
        if not value:
            return None
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
        fields = ('id', 'image_url', 'title', 'subtitle', 'tag', 'link', 'button_text', 'link_two', 'button_text_two', 'order', 'is_active', 'created_at')
        read_only_fields = ('created_at',)

    def get_image_url(self, obj):
        return get_transformed_cloudinary_url(obj.image_url)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    delivery_charge = serializers.SerializerMethodField()
    tax_amount = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    free_delivery_threshold = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'created_at', 'items', 'subtotal', 'delivery_charge', 'tax_amount', 'grand_total', 'free_delivery_threshold')

    def get_subtotal(self, obj):
        return sum(item.quantity * item.product.price for item in obj.items.all())

    def get_tax_amount(self, obj):
        return sum(
            item.quantity * item.product.price * item.product.tax_percentage / 100
            for item in obj.items.all()
        )

    def get_delivery_charge(self, obj):
        subtotal = self.get_subtotal(obj)
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        if subtotal > 0 and subtotal <= settings_obj.free_delivery_threshold:
            return settings_obj.delivery_charge
        return 0

    def get_grand_total(self, obj):
        return self.get_subtotal(obj) + self.get_tax_amount(obj) + self.get_delivery_charge(obj)

    def get_free_delivery_threshold(self, obj):
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        return settings_obj.free_delivery_threshold

class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        from store.models import StoreSettings
        model = StoreSettings
        fields = ('free_delivery_threshold', 'delivery_charge')


class WishlistItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'product_detail', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_product(self, value):
        user = self.context['request'].user
        if WishlistItem.objects.filter(user=user, product=value).exists():
            raise serializers.ValidationError('Product already in wishlist.')
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
