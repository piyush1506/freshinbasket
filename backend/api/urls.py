
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, CategoryViewSet, ProductViewSet, SlideViewSet,
    OrderViewSet, DeliveryAssignmentViewSet,
    CartViewSet, LoginView, RegisterView, LogoutView, ContactView,
    upload_image, HomeApiView, StoreSettingsView
)
from orders.views import CreateRazorpayOrderView, VerifyPaymentView, CreateCODOrderView
from orders.delivery_views import (
    DeliveryDashboardView,
    DeliveryAssignedOrdersView,
    DeliveryUpdateStatusView,
    DeliveryEarningsView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'slides', SlideViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'deliveries', DeliveryAssignmentViewSet, basename='delivery')
router.register(r'cart', CartViewSet, basename='cart')

urlpatterns = [
    # Home Endpoint
    path('home/', HomeApiView.as_view(), name='home'),
    
    # Store Settings
    path('store-info/', StoreSettingsView.as_view(), name='settings'),

    # JWT Auth
    path('auth/login/', LoginView.as_view({'post': 'login'}), name='login'),
    path('auth/register/', RegisterView.as_view({'post': 'create'}), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Payment
    path('payment/create-order/', CreateRazorpayOrderView.as_view(), name='create_razorpay_order'),
    path('payment/verify/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('payment/cod/', CreateCODOrderView.as_view(), name='create_cod_order'),

    # Delivery Boy Panel
    path('delivery/dashboard/', DeliveryDashboardView.as_view(), name='delivery_dashboard'),
    path('delivery/orders/', DeliveryAssignedOrdersView.as_view(), name='delivery_orders'),
    path('delivery/orders/<int:order_id>/status/', DeliveryUpdateStatusView.as_view(), name='delivery_update_status'),
    path('delivery/earnings/', DeliveryEarningsView.as_view(), name='delivery_earnings'),

    # Contact
    path('contact/', include([
        path('', ContactView.as_view({'get': 'list', 'post': 'create'}), name='contact_list'),
        path('<int:pk>/', ContactView.as_view({'get': 'retrieve'}), name='contact_detail'),
    ])),

    # Image Upload
    path('upload/', upload_image, name='upload_image'),

    # Router URLs
    path('', include(router.urls)),
]
