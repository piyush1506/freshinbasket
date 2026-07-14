import logging
import requests
import cloudinary.uploader
from django.conf import settings
from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import exception_handler as drf_exception_handler
from users.models import User
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.db.models import Prefetch, F, Q, Case, When, Value, IntegerField
from rest_framework.exceptions import ValidationError
from store.models import Category, Product, Slide, ContactQuery, WishlistItem, SubProduct, Section
from orders.models import Order, DeliveryAssignment, Cart, CartItem, Review, DeliverySlot
from users.models import OTPVerification
import random
import datetime
from django.utils import timezone
from .utils import send_msg91_otp
from .serializers import (
    UserSerializer, RegisterSerializer, CategorySerializer, ProductSerializer,
    SearchProductSerializer, SlideSerializer, ContactQuerySerializer,
    OrderSerializer, DeliveryAssignmentSerializer, ReviewSerializer,
    CartSerializer, CartItemSerializer, LoginSerializer, UserUpdateSerializer,
    WishlistItemSerializer, DeliverySlotSerializer, SectionSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken, OutstandingToken, BlacklistedToken

logger = logging.getLogger('api')


# Custom exception handler - never leaks stack traces
def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        if isinstance(exc, (ValidationError,)):
            pass
        else:
            safe_detail = str(exc.detail) if hasattr(exc, 'detail') else 'An error occurred'
            if len(safe_detail) > 500:
                safe_detail = safe_detail[:500]
            response.data = {
                'error': safe_detail
            }
    return response


class LogoutRateThrottle(UserRateThrottle):
    scope = 'logout'


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [LogoutRateThrottle]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(
                'Logout user=%s ip=%s',
                request.user.email, request.META.get('REMOTE_ADDR')
            )
            return Response({'message': 'Logged out successfully'})
        except Exception as e:
            logger.warning(
                'Logout failed user=%s ip=%s error=%s',
                request.user.email, request.META.get('REMOTE_ADDR'), str(e)
            )
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'


class HomeApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cached = cache.get('home_page')
        if cached:
            return Response(cached)

        # Get default slides (unassigned slides, or fallback to all active slides if none unassigned)
        default_slides = Slide.objects.filter(is_active=True, section__isnull=True).order_by('order', '-created_at')
        if not default_slides.exists():
            default_slides = Slide.objects.filter(is_active=True).order_by('order', '-created_at')
        default_slides_data = SlideSerializer(default_slides, many=True, context={'request': request}).data

        # Build section-based structure
        sections = Section.objects.filter(is_active=True).prefetch_related(
            Prefetch(
                'slides',
                queryset=Slide.objects.filter(is_active=True).order_by('order', '-created_at'),
                to_attr='cached_slides'
            ),
            Prefetch(
                'categories',
                queryset=Category.objects.prefetch_related(
                    Prefetch(
                        'products',
                        queryset=Product.objects.select_related('unit').prefetch_related('categories').defer('description').filter(stock__gt=0, is_active=True),
                        to_attr='cached_products'
                    )
                )
            )
        )

        sections_data = []
        for section in sections:
            categories_data = []
            for category in section.categories.all():
                products = category.cached_products[:10]
                categories_data.append({
                    "id": category.id,
                    "name": category.name,
                    "slug": category.slug,
                    "description": category.description,
                    "image_url": category.image.url if category.image and hasattr(category.image, 'url') else None,
                    "section_name": section.name,
                    "products": ProductSerializer(
                        products,
                        many=True,
                        context={'request': request}
                    ).data
                })
            
            section_slides = section.cached_slides
            if len(section_slides) > 0:
                slides_data = SlideSerializer(section_slides, many=True, context={'request': request}).data
            else:
                slides_data = default_slides_data

            sections_data.append({
                "id": section.id,
                "name": section.name,
                "slug": section.slug,
                "description": section.description,
                "icon": section.icon,
                "image_url": section.image.url if section.image and hasattr(section.image, 'url') else None,
                "slides": slides_data,
                "categories": categories_data
            })

        # Extract a flat list of all categories for backwards compatibility with the mobile app
        categories_data_flat = []
        seen_category_ids = set()
        for sec in sections_data:
            for cat in sec["categories"]:
                if cat["id"] not in seen_category_ids:
                    categories_data_flat.append(cat)
                    seen_category_ids.add(cat["id"])

        data = {
            "slides": default_slides_data,
            "sections": sections_data,
            "categories": categories_data_flat
        }
        cache.set("home_page", data, timeout=300)
        return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_image(request):
    file = request.FILES.get('image')
    if not file:
        return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if file.content_type not in allowed_types:
        return Response({'error': 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'}, status=400)

    # Validate file size (max 5MB)
    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'File too large. Max 5MB allowed.'}, status=400)

    upload_result = cloudinary.uploader.upload(
        file,
        folder='freshinbasket',
        resource_type='image',
        allowed_formats=['jpg', 'png', 'webp', 'gif'],
    )
    return Response({
        'url': upload_result['secure_url'],
        'public_id': upload_result['public_id'],
    }, status=status.HTTP_201_CREATED)


class LoginView(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    throttle_classes = [LoginRateThrottle]

    @action(detail=False, methods=['POST'])
    def login(self, request):
        ip = request.META.get('REMOTE_ADDR')
        email = request.data.get('email', '').strip().lower()
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
        except Exception:
            logger.warning('Login failed email=%s ip=%s', email, ip)
            raise

        user = serializer.validated_data['user']
        logger.info('Login success email=%s ip=%s', email, ip)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['GET', 'PATCH'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            return Response(UserSerializer(user).data)

        new_phone = request.data.get('phone_number')
        if new_phone:
            # Clean and normalize new phone number
            raw_phone = str(new_phone).replace('+', '').replace(' ', '').strip()
            if len(raw_phone) == 12 and raw_phone.startswith('91'):
                new_phone_clean = raw_phone[2:]
            elif len(raw_phone) == 10:
                new_phone_clean = raw_phone
            else:
                return Response({'phone_number': ['Valid 10-digit phone number is required.']}, status=status.HTTP_400_BAD_REQUEST)
            
            # Only verify if it's different
            if new_phone_clean != user.phone_number:
                # Check uniqueness
                if User.objects.filter(phone_number=new_phone_clean).exclude(pk=user.pk).exists():
                    return Response({'phone_number': ['This phone number is already in use by another account.']}, status=status.HTTP_400_BAD_REQUEST)

                otp_code = request.data.get('otp_code')
                req_id = request.data.get('reqId')
                
                if not otp_code or not req_id:
                    return Response({'phone_number': ['otp_code and reqId are required to update your phone number.']}, status=status.HTTP_400_BAD_REQUEST)
                
                # Verify OTP using MSG91 Widget API
                url = "https://api.msg91.com/api/v5/widget/verifyOtp"
                headers = {
                    "authkey": settings.MSG91_AUTH_KEY,
                    "content-type": "application/json"
                }
                payload = {
                    "widgetId": settings.MSG91_WIDGET_ID,
                    "reqId": req_id,
                    "otp": str(otp_code)
                }
                
                try:
                    response = requests.post(url, headers=headers, json=payload)
                    data = response.json()
                    if data.get("type") != "success":
                        return Response({'phone_number': [data.get('message', 'Invalid OTP')]}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    return Response({'phone_number': [f'Failed to verify OTP: {str(e)}']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    @action(detail=False, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def avatar(self, request):
        user = request.user
        file = request.FILES.get('avatar')
        if not file:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'}, status=400)

        if file.size > 5 * 1024 * 1024:
            return Response({'error': 'File too large. Max 5MB allowed.'}, status=400)

        upload_result = cloudinary.uploader.upload(
            file,
            folder='freshinbasket/avatars',
            resource_type='image',
            allowed_formats=['jpg', 'png', 'webp', 'gif'],
            width=300, height=300, crop='fill',
            quality='auto',
            fetch_format='auto',
        )
        user.avatar = upload_result['secure_url']
        user.save(update_fields=['avatar'])
        logger.info('Avatar updated user=%s', user.email)
        return Response({'avatar': user.avatar}, status=status.HTTP_200_OK)


class RegisterView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        logger.info(
            'Register success email=%s ip=%s',
            user.email, request.META.get('REMOTE_ADDR')
        )
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class SlideViewSet(viewsets.ModelViewSet):
    queryset = Slide.objects.all()
    serializer_class = SlideSerializer
    permission_classes = [IsAdminRole]

    def list(self, request, *args, **kwargs):
        cache_key = 'slides_list'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=600)
        return response

    def perform_create(self, serializer):
        super().perform_create(serializer)
        cache.delete('slides_list')
        cache.delete('home_page')

    def perform_update(self, serializer):
        super().perform_update(serializer)
        cache.delete('slides_list')
        cache.delete('home_page')

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        cache.delete('slides_list')
        cache.delete('home_page')

class ContactRateThrottle(AnonRateThrottle):
    scope = 'contact'

class ContactView(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = ContactQuery.objects.all()
    serializer_class = ContactQuerySerializer
    throttle_classes = [ContactRateThrottle]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return ContactQuery.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.filter(is_active=True)
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        cache_key = 'sections_list'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=600)
        return response


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related('section').all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        qs = Category.objects.select_related('section').all()
        section_slug = self.request.query_params.get('section')
        if section_slug:
            qs = qs.filter(section__slug=section_slug)
        return qs

    def list(self, request, *args, **kwargs):
        section_slug = request.query_params.get('section', '')
        cache_key = f'categories_list:{section_slug}'

        cached = cache.get(cache_key)
        if cached is not None:
            logger.debug('categories_list cache HIT')
            return Response(cached)

        logger.debug('categories_list cache MISS')
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=600)  # 10 minutes
        return response

class SearchRateThrottle(UserRateThrottle):
    scope = 'search'


class CartRateThrottle(UserRateThrottle):
    scope = 'cart'


class SendOTPRateThrottle(AnonRateThrottle):
    scope = 'otp_send'


class VerifyOTPRateThrottle(AnonRateThrottle):
    scope = 'otp_verify'




class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None
    throttle_classes = [SearchRateThrottle]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related('unit', 'section').prefetch_related(
            'categories',
            Prefetch('subproducts', queryset=SubProduct.objects.select_related('unit'))
        ).defer('description')
        
        # Admins can see all products, regular users only see active ones
        user = self.request.user
        if not (user and user.is_authenticated and getattr(user, 'role', '') == 'ADMIN'):
            qs = qs.filter(is_active=True)
            
        category_slug = self.request.query_params.get('category')
        if category_slug:
            qs = qs.filter(categories__slug=category_slug)
        section_slug = self.request.query_params.get('section')
        if section_slug:
            qs = qs.filter(section__slug=section_slug)
        return qs

    def list(self, request, *args, **kwargs):
        category_slug = request.query_params.get('category', '')
        section_slug = request.query_params.get('section', '')
        cache_key = f'products_list:{section_slug}:{category_slug}'

        cached = cache.get(cache_key)
        if cached is not None:
            logger.debug('products_list cache HIT key=%s', cache_key)
            return Response(cached)

        logger.debug('products_list cache MISS key=%s', cache_key)
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=120)
        return response
# @method_decorator(cache_page(60 * 2), name='list')
# class ProductViewSet(viewsets.ModelViewSet):
#     serializer_class = ProductSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]
#     pagination_class = None
#     throttle_classes = [SearchRateThrottle]

#     def get_queryset(self):
#         qs = Product.objects.prefetch_related('categories').defer('description')
#         category_slug = self.request.query_params.get('category')
#         if category_slug:
#             qs = qs.filter(categories__slug=category_slug)
#         return qs


    @action(detail=False, methods=['GET'])
    def search(self, request):
        q = request.query_params.get('q', '').strip()
        suggest = request.query_params.get('suggest', '').lower() in {'1', 'true', 'yes'}
        index = request.query_params.get('index', '').lower() in {'1', 'true', 'yes'}
        if not q and not suggest and not index:
            return Response([])

        try:
            limit = int(request.query_params.get('limit', 20))
        except (TypeError, ValueError):
            limit = 20
        limit = max(1, min(limit, 1000 if suggest or index else 100))

        search_version = cache.get('product_search_version', 1)
        normalized_q = q.lower()
        mode = 'index' if index else 'suggest' if suggest else 'full'
        cache_key = f"product_search:v{search_version}:{mode}:{normalized_q}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        if index:
            products = Product.objects.filter(is_active=True).order_by('name')[:limit]
            data = SearchProductSerializer(products, many=True, context={'request': request}).data
            cache.set(cache_key, data, timeout=300)
            return Response(data)

        if suggest:
            qs = Product.objects.filter(is_active=True)
            if q:
                qs = qs.filter(name__icontains=q)
                qs = qs.annotate(
                    search_rank=Case(
                        When(name__istartswith=q, then=Value(0)),
                        default=Value(1),
                        output_field=IntegerField(),
                    )
                ).order_by('search_rank', 'name')
            else:
                qs = qs.order_by('name')
            products = list(qs[:limit])
            data = SearchProductSerializer(products, many=True, context={'request': request}).data
            cache.set(cache_key, data, timeout=300)
            return Response(data)

        products = Product.objects.filter(is_active=True, name__icontains=q).annotate(
            search_rank=Case(
                When(name__istartswith=q, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by('search_rank', 'name')[:limit]
        data = SearchProductSerializer(products, many=True, context={'request': request}).data
        cache.set(cache_key, data, timeout=60)
        return Response(data)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        qs = Order.objects.select_related('customer').prefetch_related('items__product').select_related('review').order_by('-created_at')
        if user.role == User.Role.ADMIN:
            return qs.all()
        elif user.role == User.Role.DELIVERY:
            return qs.filter(Q(customer=user) | Q(delivery_assignment__delivery_boy=user)).distinct()
        return qs.filter(customer=user)

    def _reject_locked_address_change(self, request, order):
        address_fields = {'delivery_address', 'delivery_latitude', 'delivery_longitude'}
        is_address_update = any(field in request.data for field in address_fields)

        if is_address_update and order.status == Order.Status.OUT_FOR_DELIVERY:
            return Response(
                {'error': 'Address cannot be changed after the order is out for delivery.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return None

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        locked_response = self._reject_locked_address_change(request, order)
        if locked_response:
            return locked_response
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        locked_response = self._reject_locked_address_change(request, order)
        if locked_response:
            return locked_response
        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        # Only allow cancellation if the order is not yet out for delivery
        if order.status in [Order.Status.OUT_FOR_DELIVERY, Order.Status.DELIVERED, Order.Status.CANCELLED]:
            return Response(
                {'error': 'Cannot cancel this order. It is already processed, out for delivery, or cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        reason = request.data.get('reason')
        if reason:
            order.cancellation_reason = reason

        order.status = Order.Status.CANCELLED
        
        update_fields = ['status']
        if reason:
            update_fields.append('cancellation_reason')
            
        # Handle Razorpay Refund
        if order.payment_method == Order.PaymentMethod.ONLINE and order.is_paid and order.payment_id:
            import razorpay
            try:
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                refund = client.payment.refund(order.payment_id, {'amount': int(order.total_amount * 100)})
                order.refund_id = refund.get('id')
                order.refund_status = 'PROCESSED'
                update_fields.extend(['refund_id', 'refund_status'])
                logger.info(f"Refund successful for Order {order.id} - Refund ID: {order.refund_id}")
            except Exception as e:
                order.refund_status = 'FAILED'
                update_fields.append('refund_status')
                logger.error(f"Refund failed for Order {order.id} with Payment ID {order.payment_id}: {str(e)}")

        # Restore stock for each item
        for item in order.items.all():
            Product.objects.filter(id=item.product_id).update(stock=F('stock') + item.quantity)

        order.save(update_fields=update_fields)
        
        message = 'Order cancelled successfully'
        if order.payment_method == Order.PaymentMethod.ONLINE and order.is_paid:
            if order.refund_status == 'PROCESSED':
                message = 'Order cancelled successfully. You will get your refund in 5 to 7 days.'
            elif order.refund_status == 'FAILED':
                message = 'Order cancelled successfully. Refund is pending manual review and will be processed soon.'

        return Response({'message': message, 'status': order.status})


class DeliveryAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return DeliveryAssignment.objects.select_related('order', 'delivery_boy').all()
        elif user.role == User.Role.DELIVERY:
            return DeliveryAssignment.objects.filter(delivery_boy=user).select_related('order')
        return DeliveryAssignment.objects.none()


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [CartRateThrottle]

    def get_queryset(self):
        CartItem.objects.filter(cart__user=self.request.user, product__is_active=False).delete()
        return Cart.objects.filter(user=self.request.user).prefetch_related('items__product')

    def get_object(self):
        # We don't prefetch here because actions like add_item and remove_item 
        # modify the items and need fresh data for the response.
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

    def retrieve(self, request, *args, **kwargs):
        CartItem.objects.filter(cart__user=self.request.user, product__is_active=False).delete()
        cart = Cart.objects.prefetch_related('items__product').get(user=self.request.user)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['POST'])
    def add_item(self, request):
        from decimal import Decimal, InvalidOperation
        cart = self.get_object()
        product_id = request.data.get('product_id')
        try:
            quantity = Decimal(str(request.data.get('quantity', 1)))
        except (InvalidOperation, TypeError, ValueError):
            return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
            if not product.is_active:
                return Response({'error': f'"{product.name}" is no longer available'}, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': max(Decimal('0.001'), quantity)}
        )

        if not created:
            # If item exists, we add the delta. 
            # If the resulting quantity is <= 0, we remove the item.
            new_quantity = cart_item.quantity + quantity
            if new_quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = new_quantity
                cart_item.save()

        # Re-fetch with prefetch for an efficient response
        cart = Cart.objects.prefetch_related('items__product').get(id=cart.id)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['DELETE'])
    def remove_item(self, request):
        cart = self.get_object()
        product_id = request.data.get('product_id')
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        # Re-fetch with prefetch for an efficient response
        cart = Cart.objects.prefetch_related('items__product').get(id=cart.id)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['POST'])
    def merge(self, request):
        cart = self.get_object()
        guest_items = request.data.get('items', [])
        if not isinstance(guest_items, list):
            return Response({'error': 'items must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        for item in guest_items:
            product_id = item.get('product_id') or item.get('id')
            from decimal import Decimal, InvalidOperation
            try:
                quantity = Decimal(str(item.get('quantity', 1)))
            except (InvalidOperation, ValueError, TypeError):
                continue
                
            if quantity <= 0:
                continue

            try:
                product = Product.objects.get(id=product_id)
                if not product.is_active:
                    continue
                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart,
                    product=product,
                    defaults={'quantity': quantity}
                )
                if not created:
                    cart_item.quantity += quantity
                    cart_item.save()
            except Product.DoesNotExist:
                continue

        # Re-fetch with prefetch for an efficient response
        cart = Cart.objects.prefetch_related('items__product').get(id=cart.id)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['DELETE'])
    def clear(self, request):
        cart = self.get_object()
        CartItem.objects.filter(cart=cart).delete()
        return Response(CartSerializer(cart).data)


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related('product').prefetch_related('product__categories').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['DELETE'])
    def remove(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return Response({'message': 'Removed from wishlist'})
        return Response({'error': 'Item not found in wishlist'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'])
    def ids(self, request):
        product_ids = WishlistItem.objects.filter(user=request.user).values_list('product_id', flat=True)
        return Response(list(product_ids))


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related('order')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StoreSettingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from store.models import StoreSettings
        from .serializers import StoreSettingsSerializer
        cache_key = 'store_settings'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        settings_obj = StoreSettings.get_settings()
        serializer = StoreSettingsSerializer(settings_obj)
        data = serializer.data
        cache.set(cache_key, data, timeout=300)
        return Response(data)

class SendOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SendOTPRateThrottle]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize/clean phone number
        raw_phone = str(phone_number).replace('+', '').replace(' ', '').strip()
        if len(raw_phone) == 12 and raw_phone.startswith('91'):
            national_phone = raw_phone[2:]
        elif len(raw_phone) == 10:
            national_phone = raw_phone
        else:
            return Response({'error': 'Valid 10-digit phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        msg91_phone = '91' + national_phone
        
        # Using MSG91 Widget API (captcha disabled)
        url = "https://api.msg91.com/api/v5/widget/sendOtp"
        
        headers = {
            "authkey": settings.MSG91_AUTH_KEY,
            "content-type": "application/json"
        }
        
        payload = {
            "widgetId": settings.MSG91_WIDGET_ID,
            "identifier": str(msg91_phone)
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()
            logger.info(f'MSG91 SendOTP Response: {data}')  # Debug log
            if data.get("type") == "success":
                # Return reqId - frontend must save this and send it back during verify
                return Response({'message': 'OTP sent successfully.', 'reqId': data.get('message')})
            return Response({'error': data.get('message', 'Failed to send OTP'), 'msg91_response': data}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [VerifyOTPRateThrottle]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp_code = request.data.get('otp_code')
        
        if not phone_number or not otp_code:
            return Response({'error': 'Phone number and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize/clean phone number
        raw_phone = str(phone_number).replace('+', '').replace(' ', '').strip()
        if len(raw_phone) == 12 and raw_phone.startswith('91'):
            national_phone = raw_phone[2:]
        elif len(raw_phone) == 10:
            national_phone = raw_phone
        else:
            return Response({'error': 'Valid 10-digit phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db_phone = national_phone
        msg91_phone = '91' + national_phone

        # Must use Widget verify API since OTP was sent via Widget API
        req_id = request.data.get('reqId')  # reqId returned from sendOtp
        if not req_id:
            return Response({'error': 'reqId is required. Send OTP first.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.conf import settings
        url = "https://api.msg91.com/api/v5/widget/verifyOtp"
        headers = {
            "authkey": settings.MSG91_AUTH_KEY,
            "content-type": "application/json"
        }
        payload = {
            "widgetId": settings.MSG91_WIDGET_ID,
            "reqId": req_id,
            "otp": str(otp_code)
        }
        
        is_otp_valid = False
        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()
            logger.info(f'MSG91 VerifyOTP Response: {data}')  # Debug log
            if data.get("type") == "success":
                is_otp_valid = True
            else:
                return Response({'error': data.get('message', 'Invalid OTP')}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        if is_otp_valid:
            # Find or create user
            user, created = User.objects.get_or_create(
                phone_number=db_phone,
                defaults={
                    'username': None,
                    'email': None,
                }
            )
            
            if created:
                user.set_unusable_password()
                user.save()
                logger.info(f'New user registered via OTP: {db_phone}')
            else:
                logger.info(f'User logged in via OTP: {db_phone}')
                
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            from api.serializers import UserSerializer
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
                'is_new_user': created
            })
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

class RetryOTPView(APIView):
    def post(self, request):
        return Response({'error': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class OTPLogsView(APIView):
    def get(self, request):
        return Response({'error': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class DeliveryRegisterView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        from .serializers import DeliveryRegisterSerializer
        serializer = DeliveryRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        logger.info(
            'Delivery Register success phone=%s ip=%s',
            user.phone_number, request.META.get('REMOTE_ADDR')
        )
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class DeliverySlotViewSet(viewsets.ModelViewSet):
    queryset = DeliverySlot.objects.filter(is_active=True).order_by('sort_order', 'order_cutoff_time')
    serializer_class = DeliverySlotSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['GET'])
    def current(self, request):
        result = DeliverySlot.get_current_slot()
        slot = result.get('slot')
        is_next_day = result.get('is_next_day', False)
        
        if not slot:
            return Response({'display_label': None, 'is_next_day': True})
            
        data = self.get_serializer(slot).data
        data['is_next_day'] = is_next_day
        return Response(data)

class SectionViewSet(viewsets.ModelViewSet):
    pass
