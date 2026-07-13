import cloudinary.uploader
from rest_framework import serializers
from users.models import User
from store.models import Category, Product, Slide, ContactQuery, Unit, WishlistItem, SubProduct, Section
from orders.models import Order, OrderItem, DeliveryAssignment, Cart, CartItem, Review, DeliverySlot
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


def get_transformed_cloudinary_url(url, width=None, quality=None):
    if not url:
        return None
    
    # Add Cloudinary transformations for optimal quality
    if 'cloudinary.com' in url and '/upload/' in url:
        parts = url.split('/upload/', 1)
        if len(parts) == 2:
            if quality == 'original':
                if width:
                    transformation = f"c_scale,w_{width},q_100"
                    return f"{parts[0]}/upload/{transformation}/{parts[1]}"
                return url
            
            # q_auto,f_auto: Automatic quality and format
            # e_sharpen:60: Increases clarity of edges (essential for upscaling)
            # e_improve: AI-based color and contrast enhancement
            transformation = "q_auto:best,f_auto,e_sharpen:60,e_improve"
            if width:
                transformation = f"c_scale,w_{width},{transformation}"  # c_scale upscales small images
            return f"{parts[0]}/upload/{transformation}/{parts[1]}"
    
    return url


class SectionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ('id', 'name', 'slug', 'description', 'icon', 'image', 'image_url', 'product_label', 'order', 'is_active')

    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            return get_transformed_cloudinary_url(obj.image.url, width=600)
        return None


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), required=False, allow_null=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default=None)

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'slug', 'image', 'image_url', 'section', 'section_name')

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
    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(), source='section', write_only=True, required=False, allow_null=True
    )
    section_name = serializers.CharField(source='section.name', read_only=True, default=None)
    section_slug = serializers.CharField(source='section.slug', read_only=True, default=None)
    section_product_label = serializers.CharField(source='section.product_label', read_only=True, default=None)
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
            'section', 'section_id', 'section_name', 'section_slug', 'section_product_label',
            'order_step', 'min_order_qty', 'is_active',
            'image', 'image_url', 'created_at', 'updated_at',
            'categories', 'category_names', 'subproducts',
        )

    def get_image_url(self, obj):
        if obj.image_url and hasattr(obj.image_url, 'url'):
            url = obj.image_url.url
        else:
            url = obj.image_url
        
        return get_transformed_cloudinary_url(url, quality='original')

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
    section_slug = serializers.CharField(source='section.slug', read_only=True, default=None)
    section_product_label = serializers.CharField(source='section.product_label', read_only=True, default=None)

    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'stock', 'tax_percentage', 'mrp', 'discount_percentage', 'discount_amount', 'image_url', 'unit', 'order_step', 'min_order_qty', 'section_slug', 'section_product_label')

    def get_unit(self, obj):
        if obj.unit:
            return obj.unit.name
        return 'kg'

    def get_image_url(self, obj):
        if not obj.image_url:
            return None
        url = obj.image_url.url if hasattr(obj.image_url, 'url') else obj.image_url
        return get_transformed_cloudinary_url(url, width=200)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image_url = serializers.SerializerMethodField()
    tax_percentage = serializers.DecimalField(source='product.tax_percentage', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_image_url', 'quantity', 'unit_name', 'unit_price', 'total_price', 'tax_percentage')

    def get_product_image_url(self, obj):
        if not obj.product or not obj.product.image_url:
            return None
        url = obj.product.image_url.url if hasattr(obj.product.image_url, 'url') else obj.product.image_url
        return get_transformed_cloudinary_url(url, width=200)


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
        if order.customer_id != request.user.id:
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
            'is_paid', 'payment_method', 'payment_id', 'refund_id', 'refund_status', 'items', 'review',
        )
        read_only_fields = (
            'id', 'order_number', 'customer', 'status',
            'subtotal', 'delivery_charge', 'total_amount',
            'created_at', 'is_paid', 'payment_method', 'payment_id', 'refund_id', 'refund_status'
        )

    def get_review(self, obj):
        try:
            review = obj.review
            return {
                'id': review.id,
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at.isoformat(),
            }
        except Exception:
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
    order_step = serializers.DecimalField(source='product.order_step', max_digits=8, decimal_places=3, read_only=True)
    min_order_qty = serializers.DecimalField(source='product.min_order_qty', max_digits=8, decimal_places=3, read_only=True)

    stock = serializers.ReadOnlyField(source='product.stock')

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'name', 'price', 'image', 'quantity', 'unit', 'mrp', 'discount_percentage', 'total_price', 'tax_percentage', 'order_step', 'min_order_qty', 'stock')

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

    def validate_address(self, value):
        if value and len(value) > 1000:
            raise serializers.ValidationError('Address is too long (max 1000 characters).')
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
    image = serializers.ImageField(write_only=True, required=False)
    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(), source='section', write_only=True, required=False, allow_null=True
    )
    section_name = serializers.CharField(source='section.name', read_only=True, default=None)

    class Meta:
        model = Slide
        fields = ('id', 'image', 'image_url', 'title', 'subtitle', 'tag', 'text_color', 'link', 'button_text', 'link_two', 'button_text_two', 'order', 'is_active', 'section', 'section_id', 'section_name', 'created_at')
        read_only_fields = ('created_at',)

    def get_image_url(self, obj):
        return get_transformed_cloudinary_url(obj.image_url, quality='original')

    def create(self, validated_data):
        image = validated_data.pop('image', None)
        if image:
            upload_result = cloudinary.uploader.upload(
                image, folder='freshinbasket/slides',
                resource_type='image',
                allowed_formats=['jpg', 'png', 'webp', 'gif'],
            )
            validated_data['image_url'] = upload_result['secure_url']
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image = validated_data.pop('image', None)
        if image:
            upload_result = cloudinary.uploader.upload(
                image, folder='freshinbasket/slides',
                resource_type='image',
                allowed_formats=['jpg', 'png', 'webp', 'gif'],
            )
            validated_data['image_url'] = upload_result['secure_url']
        return super().update(instance, validated_data)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    delivery_charge = serializers.SerializerMethodField()
    tax_amount = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    free_delivery_threshold = serializers.SerializerMethodField()

    is_free_dhaniya_eligible = serializers.SerializerMethodField()
    total_weight_kg = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'created_at', 'items', 'subtotal', 'delivery_charge', 'tax_amount', 'grand_total', 'free_delivery_threshold', 'is_free_dhaniya_eligible', 'total_weight_kg')

    def get_subtotal(self, obj):
        return sum(item.quantity * item.product.price for item in obj.items.all())

    def get_tax_amount(self, obj):
        return sum(
            item.quantity * item.product.price * item.product.tax_percentage / 100
            for item in obj.items.all()
        )

    def get_delivery_charge(self, obj):
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()

        if settings_obj.free_delivery_first_order:
            from orders.models import Order
            # Check if this user has any prior non-cancelled orders
            has_prior_orders = Order.objects.filter(customer=obj.user).exclude(status=Order.Status.CANCELLED).exists()
            if not has_prior_orders:
                return 0

        subtotal = self.get_subtotal(obj)
        if subtotal > 0 and subtotal <= settings_obj.free_delivery_threshold:
            return settings_obj.delivery_charge
        return 0

    def get_grand_total(self, obj):
        return self.get_subtotal(obj) + self.get_tax_amount(obj) + self.get_delivery_charge(obj)

    def get_free_delivery_threshold(self, obj):
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        return settings_obj.free_delivery_threshold

    def get_total_weight_kg(self, obj):
        from decimal import Decimal
        total = Decimal('0.0')
        for item in obj.items.all():
            unit_name = item.product.unit.name.lower() if item.product.unit else 'kg'
            if unit_name == 'kg':
                total += item.quantity
            elif unit_name == '500g':
                total += item.quantity * Decimal('0.5')
            elif unit_name == '250g':
                total += item.quantity * Decimal('0.25')
            elif unit_name == '100g':
                total += item.quantity * Decimal('0.1')
        return total

    def get_is_free_dhaniya_eligible(self, obj):
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        if not settings_obj.is_free_dhaniya_active:
            return False
        total_weight = self.get_total_weight_kg(obj)
        return total_weight >= settings_obj.free_dhaniya_threshold_kg

class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        from store.models import StoreSettings
        model = StoreSettings
        fields = (
            'free_delivery_threshold', 'delivery_charge', 'max_delivery_radius',
            'is_announcement_active', 'announcement_message',
            'announcement_bg_color', 'announcement_text_color',
            'free_delivery_first_order', 'is_free_dhaniya_active', 'free_dhaniya_threshold_kg'
        )


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


class DeliveryRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('phone_number', 'username', 'email')
        extra_kwargs = {
            'phone_number': {
                'required': True,
                'validators': []  # Remove default UniqueValidator to handle upgrade logic in validate()
            },
            'username': {'required': True},
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate(self, attrs):
        phone_number = attrs.get('phone_number')
        email = attrs.get('email')

        # Normalize/clean phone number
        raw_phone = str(phone_number).replace('+', '').replace(' ', '').strip()
        if len(raw_phone) == 12 and raw_phone.startswith('91'):
            clean_phone = raw_phone[2:]
        elif len(raw_phone) == 10:
            clean_phone = raw_phone
        else:
            raise serializers.ValidationError({'phone_number': 'Valid 10-digit phone number is required.'})

        attrs['phone_number'] = clean_phone

        # Check user by phone number
        user_by_phone = User.objects.filter(phone_number=clean_phone).first()
        if user_by_phone and user_by_phone.role == User.Role.DELIVERY:
            raise serializers.ValidationError({'phone_number': 'A delivery agent with this phone number already exists.'})

        # Check email
        if email:
            email = email.strip().lower()
            attrs['email'] = email
            user_by_email = User.objects.filter(email=email).first()
            if user_by_email:
                if user_by_email.phone_number != clean_phone:
                    raise serializers.ValidationError({'email': 'A user with this email already exists.'})
                if user_by_email.role == User.Role.DELIVERY:
                    raise serializers.ValidationError({'email': 'A delivery agent with this email already exists.'})

        return attrs

    def create(self, validated_data):
        phone_number = validated_data['phone_number']
        user = User.objects.filter(phone_number=phone_number).first()
        if user:
            user.username = validated_data['username']
            if validated_data.get('email'):
                user.email = validated_data.get('email')
            user.role = User.Role.DELIVERY
            user.save()
        else:
            user = User(
                username=validated_data['username'],
                email=validated_data.get('email'),
                phone_number=phone_number,
                role=User.Role.DELIVERY,
            )
            user.set_unusable_password()
            user.save()
        
        from users.models import DeliveryProfile
        DeliveryProfile.objects.get_or_create(user=user, defaults={'is_active': False})
        return user


class DeliverySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySlot
        fields = (
            'id', 'name', 'display_label',
            'order_start_time', 'order_cutoff_time',
            'delivery_start_time', 'delivery_end_time',
            'assignment_hour', 'assignment_minute',
            'cleanup_hour', 'cleanup_minute',
            'is_active', 'sort_order',
        )
