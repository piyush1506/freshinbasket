from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from store.models import Product
from django.conf import settings
from django.db.models import Count, Q, F
from django.db import transaction
from .models import Order, OrderItem, Cart, CartItem
from .utils import haversine_distance

import razorpay
from django.utils import timezone

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _get_delivery_slot():
    from orders.models import DeliverySlot
    now = timezone.localtime(timezone.now()).time()
    slot = DeliverySlot.objects.filter(
        is_active=True,
        order_cutoff_time__gt=now
    ).order_by('order_cutoff_time').first()
    if not slot:
        slot = DeliverySlot.objects.filter(is_active=True).order_by('order_cutoff_time').first()
    return slot.display_label if slot else "7 AM - 12 PM"


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
        except razorpay.errors.BadRequestError as e:
            return Response({'error': f'Payment gateway error: {str(e)}'}, status=400)
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

            with transaction.atomic():
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
                    # Atomic stock decrement — prevents overselling under concurrent orders
                    updated = Product.objects.filter(
                        id=item.product.id,
                        stock__gte=item.quantity   # only update if enough stock exists
                    ).update(stock=F('stock') - item.quantity)

                    if not updated:
                        raise ValueError(f'"{item.product.name}" went out of stock during checkout.')

                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        product_name=item.product.name,
                        quantity=item.quantity,
                        unit_name=item.product.unit.name if item.product.unit else 'kg',
                        unit_price=item.product.price
                    )

                items.delete()

            from orders.services.assignment_service import AssignmentService
            AssignmentService.assign_realtime_order(order)

            return Response({
                'message': 'Payment verified and order created successfully',
                'order_id': order.id,
                'order_number': order.order_number,
            })
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=404)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
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

        with transaction.atomic():
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
                # Atomic stock decrement — prevents overselling under concurrent orders
                updated = Product.objects.filter(
                    id=item.product.id,
                    stock__gte=item.quantity   # only update if enough stock exists
                ).update(stock=F('stock') - item.quantity)

                if not updated:
                    raise ValueError(f'"{item.product.name}" went out of stock during checkout.')

                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    product_name=item.product.name,
                    quantity=item.quantity,
                    unit_name=item.product.unit.name if item.product.unit else 'kg',
                    unit_price=item.product.price
                )

            items.delete()

        from orders.services.assignment_service import AssignmentService
        AssignmentService.assign_realtime_order(order)

        return Response({
            'message': 'COD order created successfully',
            'order_id': order.id,
            'order_number': order.order_number,
            'payment_method': 'COD'
        })

