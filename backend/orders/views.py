from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import UserRateThrottle
from store.models import Product
from django.conf import settings
from django.db.models import Count, Q, F
from django.db import transaction
from .models import Order, OrderItem, Cart, CartItem
from .utils import haversine_distance

import logging
import threading
import razorpay

logger = logging.getLogger(__name__)


def _fire_and_forget_post_order(order_id):
    """Run assignment + FCM notification in a background thread.
    Never blocks the HTTP response. Never raises."""
    def _run():
        # ── Real-time assignment with retry ──
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                from orders.models import Order
                from orders.services.assignment_service import AssignmentService
                order = Order.objects.get(id=order_id)
                result = AssignmentService.assign_realtime_order(order)
                logger.info(
                    "Real-time assignment for order %s (attempt %d): %s",
                    order_id, attempt, result
                )
                if result.get('status') in ('success', 'skipped'):
                    break  # Assigned, or intentionally skipped (batch will handle)
            except Exception as e:
                logger.error(
                    "Real-time assignment attempt %d failed for order %s: %s",
                    attempt, order_id, e
                )
                if attempt < max_retries:
                    import time
                    time.sleep(2 * attempt)  # Backoff: 2s, 4s

        # ── Send FCM notification and Email ──
        try:
            from orders.models import Order
            from notifications.fcm import send_order_notification, send_admin_new_order_alert, send_admin_email_alert
            order = Order.objects.get(id=order_id)
            send_order_notification(order)
            send_admin_new_order_alert(order)
            send_admin_email_alert(order)
        except Exception as e:
            logger.warning("FCM notification failed for order %s: %s", order_id, e)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()


client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _get_delivery_slot():
    from orders.models import DeliverySlot
    result = DeliverySlot.get_current_slot()
    if result['slot']:
        return result['slot']
    if result['is_next_day']:
        return DeliverySlot.objects.filter(is_active=True).order_by('sort_order', 'order_cutoff_time').first()
    return None


from django.utils import timezone
from datetime import timedelta

def check_cancellation_limit(user):
    """
    Checks if a user has exceeded the daily cancellation limit.
    Rule: > 3 cancellations in the last 24 hours.
    Block: 5 hours from the last cancellation time.
    Returns a Response object with 400 status if blocked, else None.
    """
    now = timezone.now()
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    recent_cancellations = Order.objects.filter(
        customer=user,
        status=Order.Status.CANCELLED,
        updated_at__gte=twenty_four_hours_ago
    ).order_by('-updated_at')
    
    if recent_cancellations.count() > 3:
        last_cancellation = recent_cancellations.first()
        time_since_last = now - last_cancellation.updated_at
        if time_since_last < timedelta(hours=5):
            remaining_time = timedelta(hours=5) - time_since_last
            hours, remainder = divmod(remaining_time.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            return Response({
                'error': f'You have exceeded the daily order cancellation limit (3 per day). Please try placing an order after {hours} hours and {minutes} minutes.'
            }, status=400)
    return None


class PaymentCreateThrottle(UserRateThrottle):
    scope = 'payment_create'


class PaymentVerifyThrottle(UserRateThrottle):
    scope = 'payment_verify'


class CODOrderThrottle(UserRateThrottle):
    scope = 'cod_order'


class RazorpayConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'razorpay_key_id': settings.RAZORPAY_KEY_ID})


class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentCreateThrottle]

    def post(self, request):
        limit_response = check_cancellation_limit(request.user)
        if limit_response:
            return limit_response

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'No cart found. Please add items to cart first.'}, status=400)

        items = CartItem.objects.filter(cart=cart).select_related('product')
        if not items.exists():
            return Response({'error': 'Your cart is empty.'}, status=400)

        for item in items:
            if not item.product.is_active:
                return Response({
                    'error': f'"{item.product.name}" is no longer available'
                }, status=400)
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
        is_first_order = False
        if settings_obj.free_delivery_first_order:
            from orders.models import Order
            is_first_order = not Order.objects.filter(customer=request.user).exclude(status=Order.Status.CANCELLED).exists()

        if not is_first_order and subtotal_amount <= settings_obj.free_delivery_threshold:
            delivery_charge = settings_obj.delivery_charge
            
        total_amount = subtotal_amount + tax_amount + delivery_charge
        total_paise = int(total_amount * 100)

        if total_paise <= 0:
            return Response({'error': 'Invalid order amount.'}, status=400)

        slot = _get_delivery_slot()
        if not slot:
            return Response({'error': 'No delivery slots available for today. Please try again tomorrow.'}, status=400)

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
    throttle_classes = [PaymentVerifyThrottle]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        delivery_address = request.data.get('delivery_address', '')
        delivery_latitude = request.data.get('delivery_latitude')
        delivery_longitude = request.data.get('delivery_longitude')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Missing payment details'}, status=400)

        if not delivery_address:
            return Response({'error': 'Delivery address is required'}, status=400)
            
        if len(delivery_address) > 1000:
            return Response({'error': 'Delivery address is too long (max 1000 characters)'}, status=400)

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
                if not item.product.is_active:
                    return Response({
                        'error': f'"{item.product.name}" is no longer available'
                    }, status=400)
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
            is_first_order = False
            if settings_obj.free_delivery_first_order:
                from orders.models import Order
                is_first_order = not Order.objects.filter(customer=request.user).exclude(status=Order.Status.CANCELLED).exists()

            if not is_first_order and subtotal <= settings_obj.free_delivery_threshold:
                delivery_charge = settings_obj.delivery_charge
                
            total = subtotal + tax_amount + delivery_charge

            with transaction.atomic():
                slot = _get_delivery_slot()
                if not slot:
                    raise ValueError('No delivery slots available for today. Please try again tomorrow.')
                
                order = Order.objects.create(
                    customer=request.user,
                    subtotal=subtotal,
                    delivery_charge=delivery_charge,
                    total_amount=total,
                    delivery_address=delivery_address,
                    delivery_latitude=delivery_latitude,
                    delivery_longitude=delivery_longitude,
                    delivery_slot=slot.display_label,
                    delivery_slot_ref=slot,
                    status=Order.Status.CONFIRMED,
                    is_paid=True,
                    payment_method=Order.PaymentMethod.ONLINE,
                    payment_id=razorpay_payment_id
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

            # ── Fire-and-forget: assignment + FCM in background thread ──
            _fire_and_forget_post_order(order.id)

            return Response({
                'message': 'Payment verified and order created successfully',
                'order_id': order.id,
                'order_number': order.order_number,
                'delivery_slot': order.delivery_slot,
            })
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=404)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            logger.exception("Order creation failed in CreateRazorpayOrderView: %s", e)
            return Response({'error': 'Order creation failed. Please contact support.'}, status=500)


class CreateCODOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [CODOrderThrottle]

    def post(self, request):
        limit_response = check_cancellation_limit(request.user)
        if limit_response:
            return limit_response

        delivery_address = request.data.get('delivery_address', '')
        delivery_latitude = request.data.get('delivery_latitude')
        delivery_longitude = request.data.get('delivery_longitude')

        if not delivery_address:
            return Response({'error': 'Delivery address is required'}, status=400)
        
        if len(delivery_address) > 1000:
            return Response({'error': 'Delivery address is too long (max 1000 characters)'}, status=400)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'No cart found. Please add items to cart first.'}, status=400)

        items = CartItem.objects.filter(cart=cart).select_related('product')
        if not items.exists():
            return Response({'error': 'Your cart is empty.'}, status=400)

        try:
            for item in items:
                if not item.product.is_active:
                    return Response({
                        'error': f'"{item.product.name}" is no longer available'
                    }, status=400)
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
            is_first_order = False
            if settings_obj.free_delivery_first_order:
                from orders.models import Order
                is_first_order = not Order.objects.filter(customer=request.user).exclude(status=Order.Status.CANCELLED).exists()

            if not is_first_order and subtotal <= settings_obj.free_delivery_threshold:
                delivery_charge = settings_obj.delivery_charge

            total = subtotal + tax_amount + delivery_charge

            with transaction.atomic():
                slot = _get_delivery_slot()
                if not slot:
                    raise ValueError('No delivery slots available for today. Please try again tomorrow.')
                
                order = Order.objects.create(
                    customer=request.user,
                    subtotal=subtotal,
                    delivery_charge=delivery_charge,
                    total_amount=total,
                    delivery_address=delivery_address,
                    delivery_latitude=delivery_latitude,
                    delivery_longitude=delivery_longitude,
                    delivery_slot=slot.display_label,
                    delivery_slot_ref=slot,
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

            # ── Fire-and-forget: assignment + FCM in background thread ──
            _fire_and_forget_post_order(order.id)

            return Response({
                'message': 'COD order created successfully',
                'order_id': order.id,
                'order_number': order.order_number,
                'payment_method': 'COD',
                'delivery_slot': order.delivery_slot,
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            logger.exception("Order creation failed in CreateCODOrderView: %s", e)
            return Response({'error': 'Order creation failed. Please try again or contact support.'}, status=500)


class GenerateUPIQRView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        order_id = request.data.get('order_id')
        order_number = request.data.get('order_number')
        amount = request.data.get('amount')
        
        if not all([order_id, order_number, amount]):
            return Response({'error': 'Missing required fields'}, status=400)
            
        try:
            from orders.models import Order
            import time
            
            order = Order.objects.get(id=order_id)
            customer_name = order.customer.get_full_name() or "Customer"
            
            total_paise = int(float(amount) * 100)
            
            # Use Razorpay QR Code API — generates a real UPI QR
            # that directly opens the customer's UPI app when scanned
            close_time = int(time.time()) + 1800  # QR valid for 30 minutes
            
            qr_response = client.qrcode.create({
                "type": "upi_qr",
                "name": f"Order #{order_number}",
                "usage": "single_use",
                "fixed_amount": True,
                "payment_amount": total_paise,
                "description": f"Payment for Order #{order_number} - {customer_name}",
                "close_by": close_time,
                "notes": {
                    "order_id": str(order_id),
                    "order_number": str(order_number)
                }
            })
            
            # Log full response to see all available fields
            logger.info(f"Razorpay QR response keys: {list(qr_response.keys())}")
            logger.info(f"Razorpay QR full response: {qr_response}")
            
            qr_id = qr_response.get('id')
            image_url = qr_response.get('image_url', '')
            
            # Try to get the raw UPI intent string from the response
            # Razorpay may include it as 'qr_string', 'short_url', or 'upi_link'
            raw_qr_string = (
                qr_response.get('qr_string') or
                qr_response.get('short_url') or
                qr_response.get('upi_link') or
                ''
            )
            
            # If no raw string from create, try fetching the QR details
            if not raw_qr_string and qr_id:
                try:
                    fetch_response = client.qrcode.fetch(qr_id)
                    logger.info(f"Razorpay QR fetch response keys: {list(fetch_response.keys())}")
                    logger.info(f"Razorpay QR fetch response: {fetch_response}")
                    raw_qr_string = (
                        fetch_response.get('qr_string') or
                        fetch_response.get('short_url') or
                        fetch_response.get('upi_link') or
                        ''
                    )
                except Exception as fetch_err:
                    logger.warning(f"Could not fetch QR details: {fetch_err}")
            
            # Save the QR code ID on the order for status checking
            order.payment_id = qr_id
            order.save(update_fields=['payment_id'])
            
            return Response({
                'qr_id': qr_id,
                'image_url': image_url,
                'payment_amount': total_paise,
                'qr_string': raw_qr_string if raw_qr_string else image_url
            })
        except Exception as e:
            logger.exception(f"Error generating Razorpay QR: {e}")
            return Response({'error': f'Failed to generate QR: {str(e)}'}, status=500)


class CheckQRStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, qr_id):
        if not qr_id:
            return Response({'error': 'QR ID is required'}, status=400)
            
        try:
            qr_data = client.qrcode.fetch(qr_id)
            qr_status = qr_data.get('status', '')
            received_amount = qr_data.get('payments_amount_received', 0)
            expected_amount = qr_data.get('payment_amount', 0)
            payments_count = qr_data.get('payments_count_received', 0)
            
            # QR code API: status is 'closed' after payment for single_use QRs
            is_paid = (qr_status == 'closed' and payments_count > 0) or (received_amount > 0 and received_amount >= expected_amount)
            
            # Auto-update order proactively to prevent race conditions with webhook
            if is_paid:
                try:
                    from orders.models import Order
                    order = Order.objects.filter(payment_id=qr_id).first()
                    if order and not order.is_paid:
                        order.is_paid = True
                        order.payment_method = 'ONLINE'
                        order.save(update_fields=['is_paid', 'payment_method'])
                except Exception as update_err:
                    logger.warning(f"Failed to proactively update order from QR status: {update_err}")
            
            return Response({
                'qr_id': qr_id,
                'is_paid': is_paid,
                'received_amount': received_amount,
                'status': qr_status
            })
        except Exception as e:
            logger.exception(f"Error fetching QR status: {e}")
            return Response({'error': f'Failed to check status: {str(e)}'}, status=500)


class RazorpayWebhookView(APIView):
    """
    Receives Razorpay webhook callbacks for payment_link.paid events.
    Verifies signature, updates order, and notifies the delivery boy via FCM.
    """
    permission_classes = [permissions.AllowAny]  # Razorpay calls this — no JWT
    authentication_classes = []  # Skip auth entirely for webhooks

    def post(self, request):
        import hmac
        import hashlib
        import json as json_module

        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        if not webhook_secret:
            logger.error("RAZORPAY_WEBHOOK_SECRET not configured")
            return Response({'status': 'ok'}, status=200)  # Don't expose config issues

        # ── 1. Verify webhook signature ──
        received_signature = request.headers.get('X-Razorpay-Signature', '')
        request_body = request.body

        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            request_body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, received_signature):
            logger.warning("Razorpay webhook signature mismatch — rejecting")
            return Response({'error': 'Invalid signature'}, status=400)

        # ── 2. Parse payload ──
        try:
            payload = json_module.loads(request_body)
        except json_module.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=400)

        event = payload.get('event', '')
        logger.info(f"Razorpay webhook received: {event}")

        if event == 'payment_link.paid':
            # Legacy payment link flow
            try:
                payment_link_entity = payload['payload']['payment_link']['entity']
                payment_entity = payload['payload']['payment']['entity']

                razorpay_payment_id = payment_entity.get('id')
                amount_paid = payment_entity.get('amount', 0)  # in paise
                notes = payment_link_entity.get('notes', {})
                order_id = notes.get('order_id')
                order_number = notes.get('order_number')

                logger.info(
                    f"Payment link paid: "
                    f"payment_id={razorpay_payment_id}, amount={amount_paid}, "
                    f"order_id={order_id}, order_number={order_number}"
                )
            except (KeyError, TypeError) as e:
                logger.error(f"Razorpay webhook payload parsing error: {e}")
                return Response({'status': 'ok'}, status=200)

        elif event == 'qr_code.credited':
            # New UPI QR code flow
            try:
                qr_entity = payload['payload']['qr_code']['entity']
                payment_entity = payload['payload']['payment']['entity']

                razorpay_payment_id = payment_entity.get('id')
                amount_paid = payment_entity.get('amount', 0)  # in paise
                notes = qr_entity.get('notes', {})
                order_id = notes.get('order_id')
                order_number = notes.get('order_number')

                logger.info(
                    f"QR code credited: "
                    f"payment_id={razorpay_payment_id}, amount={amount_paid}, "
                    f"order_id={order_id}, order_number={order_number}"
                )
            except (KeyError, TypeError) as e:
                logger.error(f"Razorpay webhook payload parsing error: {e}")
                return Response({'status': 'ok'}, status=200)
        else:
            # We only care about payment events; acknowledge others silently
            return Response({'status': 'ok'}, status=200)

        if not order_id:
            logger.warning("Razorpay webhook: no order_id in notes")
            return Response({'status': 'ok'}, status=200)

        # ── 4. Update order ──
        try:
            from orders.models import Order, DeliveryAssignment
            order = Order.objects.get(id=order_id)

            if order.is_paid:
                logger.info(f"Order {order_id} already marked as paid — skipping")
                return Response({'status': 'ok'}, status=200)

            order.is_paid = True
            order.payment_method = 'ONLINE'
            order.payment_id = razorpay_payment_id
            order.status = Order.Status.DELIVERED
            order.save(update_fields=['is_paid', 'payment_method', 'payment_id', 'status'])

            logger.info(f"Order {order_id} marked as PAID and DELIVERED via webhook")

            # ── 5. Send FCM push to the assigned delivery boy ──
            try:
                assignment = DeliveryAssignment.objects.select_related('delivery_boy').get(order=order)
                delivery_boy = assignment.delivery_boy

                from notifications.fcm import send_push_to_user
                send_push_to_user(
                    user=delivery_boy,
                    title="✅ Payment Received!",
                    body=f"₹{amount_paid / 100:.2f} received for Order #{order_number}",
                    data={
                        'type': 'PAYMENT_SUCCESS',
                        'order_id': str(order_id),
                        'order_number': str(order_number),
                        'amount': str(amount_paid / 100),
                        'transaction_id': str(razorpay_payment_id),
                    }
                )
                logger.info(f"FCM payment notification sent to delivery boy {delivery_boy.id}")
            except DeliveryAssignment.DoesNotExist:
                logger.warning(f"No delivery assignment found for order {order_id}")
            except Exception as e:
                logger.error(f"FCM notification failed for order {order_id}: {e}")

        except Order.DoesNotExist:
            logger.error(f"Razorpay webhook: Order {order_id} not found in database")
        except Exception as e:
            logger.exception(f"Razorpay webhook processing error: {e}")

        return Response({'status': 'ok'}, status=200)
