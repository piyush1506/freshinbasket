from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from store.models import Product
from django.conf import settings
from django.db.models import Count, Q
from .models import Order, OrderItem, Cart, CartItem
from .utils import haversine_distance

import razorpay
from django.utils import timezone

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _get_delivery_slot():
    hour = timezone.localtime(timezone.now()).hour
    if hour >= 22:
        return "7 AM - 10 AM"
    if hour < 12:
        return "7 AM - 12 PM"
    return "4 PM - 10 PM"


class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'No cart found. Please add items to cart first.'}, status=400)

        items = CartItem.objects.filter(cart=cart).select_related('product')
        if not items.exists():
            return Response({'error': 'Your cart is empty.'}, status=400)

        for item in items:
            if item.product.stock <= 0:
                return Response({
                    'error': f'"{item.product.name}" is out of stock'
                }, status=400)
            if item.quantity > item.product.stock:
                return Response({
                    'error': f'Only {item.product.stock} units of "{item.product.name}" available'
                }, status=400)

        subtotal_amount = sum(item.product.price * item.quantity for item in items)
        
        tax_amount = sum(
            item.product.price * item.quantity * item.product.tax_percentage / 100
            for item in items
        )
        
        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()
        
        delivery_charge = 0
        if subtotal_amount <= settings_obj.free_delivery_threshold:
            delivery_charge = settings_obj.delivery_charge
            
        total_amount = subtotal_amount + tax_amount + delivery_charge
        total_paise = int(total_amount * 100)

        if total_paise <= 0:
            return Response({'error': 'Invalid order amount.'}, status=400)

        try:
            razorpay_order = client.order.create({
                'amount': total_paise,
                'currency': 'INR',
                'payment_capture': 1
            })
            return Response({
                'order_id': razorpay_order['id'],
                'amount': total_paise,
                'currency': 'INR',
                'key': settings.RAZORPAY_KEY_ID
            })
        except razorpay.errors.AuthenticationError:
            return Response({'error': 'Payment gateway authentication failed.'}, status=401)
        except Exception as e:
            return Response({'error': 'Payment gateway error. Please try again.'}, status=500)


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        delivery_address = request.data.get('delivery_address', '')
        delivery_latitude = request.data.get('delivery_latitude')
        delivery_longitude = request.data.get('delivery_longitude')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Missing payment details'}, status=400)

        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            return Response({'error': 'Invalid payment signature'}, status=400)

        try:
            cart = Cart.objects.get(user=request.user)
            items = CartItem.objects.filter(cart=cart).select_related('product')
            if not items.exists():
                return Response({'error': 'Your cart is empty.'}, status=400)

            for item in items:
                if item.product.stock <= 0:
                    return Response({
                        'error': f'"{item.product.name}" is out of stock'
                    }, status=400)
                if item.quantity > item.product.stock:
                    return Response({
                        'error': f'Only {item.product.stock} units of "{item.product.name}" available'
                    }, status=400)

            subtotal = sum(item.product.price * item.quantity for item in items)
            
            tax_amount = sum(
                item.product.price * item.quantity * item.product.tax_percentage / 100
                for item in items
            )
            
            from store.models import StoreSettings
            settings_obj = StoreSettings.get_settings()
            
            delivery_charge = 0
            if subtotal <= settings_obj.free_delivery_threshold:
                delivery_charge = settings_obj.delivery_charge
                
            total = subtotal + tax_amount + delivery_charge

            order = Order.objects.create(
                customer=request.user,
                subtotal=subtotal,
                delivery_charge=delivery_charge,
                total_amount=total,
                delivery_address=delivery_address,
                delivery_latitude=delivery_latitude,
                delivery_longitude=delivery_longitude,
                delivery_slot=_get_delivery_slot(),
                status=Order.Status.CONFIRMED,
                is_paid=True,
                payment_method=Order.PaymentMethod.ONLINE
            )

            for item in items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    product_name=item.product.name,
                    quantity=item.quantity,
                    unit_name=item.product.unit.name if item.product.unit else 'kg',
                    unit_price=item.product.price
                )
                Product.objects.filter(id=item.product.id).update(
                    stock=item.product.stock - item.quantity
                )

            items.delete()

            from django.contrib.auth import get_user_model
            from .models import DeliveryAssignment
            User = get_user_model()
            delivery_boys = User.objects.filter(role='DELIVERY')
            if delivery_boys.count() == 1:
                DeliveryAssignment.objects.create(
                    order=order,
                    delivery_boy=delivery_boys.first(),
                    notes='Auto-assigned (only one delivery boy available).'
                )

            return Response({
                'message': 'Payment verified and order created successfully',
                'order_id': order.id
            })
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=404)
        except Exception as e:
            return Response({'error': 'Order creation failed. Please contact support.'}, status=500)


class CreateCODOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        delivery_address = request.data.get('delivery_address', '')
        delivery_latitude = request.data.get('delivery_latitude')
        delivery_longitude = request.data.get('delivery_longitude')

        if not delivery_address:
            return Response({'error': 'Delivery address is required'}, status=400)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'No cart found. Please add items to cart first.'}, status=400)

        items = CartItem.objects.filter(cart=cart).select_related('product')
        if not items.exists():
            return Response({'error': 'Your cart is empty.'}, status=400)

        for item in items:
            if item.product.stock <= 0:
                return Response({
                    'error': f'"{item.product.name}" is out of stock'
                }, status=400)
            if item.quantity > item.product.stock:
                return Response({
                    'error': f'Only {item.product.stock} units of "{item.product.name}" available'
                }, status=400)

        subtotal = sum(item.product.price * item.quantity for item in items)

        tax_amount = sum(
            item.product.price * item.quantity * item.product.tax_percentage / 100
            for item in items
        )

        from store.models import StoreSettings
        settings_obj = StoreSettings.get_settings()

        delivery_charge = 0
        if subtotal <= settings_obj.free_delivery_threshold:
            delivery_charge = settings_obj.delivery_charge

        total = subtotal + tax_amount + delivery_charge

        order = Order.objects.create(
            customer=request.user,
            subtotal=subtotal,
            delivery_charge=delivery_charge,
            total_amount=total,
            delivery_address=delivery_address,
            delivery_latitude=delivery_latitude,
            delivery_longitude=delivery_longitude,
            delivery_slot=_get_delivery_slot(),
            status=Order.Status.CONFIRMED,
            is_paid=False,
            payment_method=Order.PaymentMethod.COD
        )

        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_name=item.product.unit.name if item.product.unit else 'kg',
                unit_price=item.product.price
            )
            Product.objects.filter(id=item.product.id).update(
                stock=item.product.stock - item.quantity
            )

        items.delete()

        from django.contrib.auth import get_user_model
        from .models import DeliveryAssignment
        User = get_user_model()
        delivery_boys = User.objects.filter(role='DELIVERY')
        if delivery_boys.count() == 1:
            DeliveryAssignment.objects.create(
                order=order,
                delivery_boy=delivery_boys.first(),
                notes='Auto-assigned (only one delivery boy available).'
            )

        return Response({
            'message': 'COD order created successfully',
            'order_id': order.id,
            'order_number': order.order_number,
            'payment_method': 'COD'
        })

