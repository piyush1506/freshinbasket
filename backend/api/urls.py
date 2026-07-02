
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, CategoryViewSet, ProductViewSet, SlideViewSet,
    OrderViewSet, DeliveryAssignmentViewSet,
    CartViewSet, LoginView, RegisterView, LogoutView, ContactView,
    upload_image, HomeApiView, StoreSettingsView, ReviewViewSet,
    WishlistViewSet, SendOTPView, VerifyOTPView, DeliveryRegisterView,
    DeliverySlotViewSet, SectionViewSet
)
from orders.views import CreateRazorpayOrderView, VerifyPaymentView, CreateCODOrderView
from notifications.views import RegisterFCMTokenView
from .import_views import ProductImportView, ProductTemplateDownloadView
from orders.delivery_views import (
    DeliveryDashboardView,
    DeliveryAssignedOrdersView,
    DeliveryUpdateStatusView,
    DeliveryEarningsView,
    DeliveryUpdateProfileView,
    UpdateDeliveryLocationView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'slides', SlideViewSet)
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'deliveries', DeliveryAssignmentViewSet, basename='delivery')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'delivery-slots', DeliverySlotViewSet, basename='delivery-slot')

urlpatterns = [
    # Home Endpoint
    path('home/', HomeApiView.as_view(), name='home'),
    
    # Store Settings
    path('store-info/', StoreSettingsView.as_view(), name='settings'),

    # JWT Auth
    path('auth/login/', LoginView.as_view({'post': 'login'}), name='login'),
    path('auth/register/', RegisterView.as_view({'post': 'create'}), name='register'),
    path('auth/delivery-register/', DeliveryRegisterView.as_view({'post': 'create'}), name='delivery_register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Mobile OTP Auth
    path('auth/send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),

    # Payment
    path('payment/create-order/', CreateRazorpayOrderView.as_view(), name='create_razorpay_order'),
    path('payment/verify/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('payment/cod/', CreateCODOrderView.as_view(), name='create_cod_order'),

    # Delivery Boy Panel
    path('delivery/dashboard/', DeliveryDashboardView.as_view(), name='delivery_dashboard'),
    path('delivery/orders/', DeliveryAssignedOrdersView.as_view(), name='delivery_orders'),
    path('delivery/orders/<int:order_id>/status/', DeliveryUpdateStatusView.as_view(), name='delivery_update_status'),
    path('delivery/earnings/', DeliveryEarningsView.as_view(), name='delivery_earnings'),
    path('delivery/profile/', DeliveryUpdateProfileView.as_view(), name='delivery_profile'),
    path('delivery/location/', UpdateDeliveryLocationView.as_view(), name='delivery_location'),

    # Contact
    path('contact/', include([
        path('', ContactView.as_view({'get': 'list', 'post': 'create'}), name='contact_list'),
        path('<int:pk>/', ContactView.as_view({'get': 'retrieve'}), name='contact_detail'),
    ])),

    # Image Upload
    path('upload/', upload_image, name='upload_image'),

    # Excel Import
    path('import/products/', ProductImportView.as_view(), name='import_products'),
    path('import/products/template/', ProductTemplateDownloadView.as_view(), name='import_products_template'),

    # Push Notifications — FCM token registration
    path('notifications/register-token/', RegisterFCMTokenView.as_view(), name='register_fcm_token'),

    # Router URLs
    path('', include(router.urls)),
]
