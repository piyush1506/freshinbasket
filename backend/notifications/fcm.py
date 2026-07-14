"""
notifications/fcm.py
Firebase Cloud Messaging sender utility.
Uses firebase-admin SDK (server-to-device push).
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

_firebase_app = None


def _get_app():
    """Lazy-initialize Firebase Admin SDK."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        creds_path = getattr(settings, 'FCM_CREDENTIALS_FILE', None)
        if not creds_path:
            logger.warning("FCM_CREDENTIALS_FILE not set — push notifications disabled")
            return None

        cred = credentials.Certificate(str(creds_path))
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return None


def send_push(token: str, title: str, body: str, data: dict = None) -> bool:
    """
    Send a single FCM push notification to a device token.
    Returns True if sent successfully, False otherwise.
    Never raises — caller should not be affected by notification failures.
    """
    app = _get_app()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='order_updates',
                    sound='default',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound='default'),
                ),
            ),
            token=token,
        )
        messaging.send(message, app=app)
        logger.info(f"FCM push sent: {title}")
        return True
    except Exception as e:
        logger.warning(f"FCM push failed for token {token[:20]}...: {e}")
        return False


def send_push_to_user(user, title: str, body: str, data: dict = None) -> int:
    """
    Send a push notification to ALL active tokens of a user.
    Automatically removes stale/invalid tokens.
    Returns number of successful sends.
    """
    from .models import FCMToken
    from firebase_admin import messaging as fb_messaging

    tokens = FCMToken.objects.filter(user=user)
    if not tokens.exists():
        logger.debug(f"No FCM tokens for user {user.id} — skipping push")
        return 0

    sent = 0
    stale_tokens = []

    for fcm_token in tokens:
        try:
            success = send_push(fcm_token.token, title, body, data)
            if success:
                sent += 1
        except Exception as e:
            error_str = str(e)
            # Remove tokens that are no longer valid
            if any(code in error_str for code in [
                'registration-token-not-registered',
                'invalid-registration-token',
                'Requested entity was not found',
            ]):
                stale_tokens.append(fcm_token.id)

    if stale_tokens:
        FCMToken.objects.filter(id__in=stale_tokens).delete()
        logger.info(f"Removed {len(stale_tokens)} stale FCM tokens for user {user.id}")

    return sent


def send_order_notification(order) -> None:
    """
    Send order confirmation push to the order's customer.
    Called from CreateCODOrderView and VerifyPaymentView after DB commit.
    Never raises — wrapped in try/except at call sites too.
    """
    try:
        if order.payment_method == 'COD':
            title = "🛒 Order Confirmed!"
            body = f"Your order {order.order_number} is confirmed. We'll deliver it soon!"
        else:
            title = "✅ Payment Successful!"
            body = f"Order {order.order_number} confirmed. Payment received."

        send_push_to_user(
            user=order.customer,
            title=title,
            body=body,
            data={'route': 'orders', 'order_id': str(order.id)},
        )
    except Exception as e:
        logger.error(f"send_order_notification failed for order {order.id}: {e}")


def send_admin_new_order_alert(order) -> None:
    """
    Send a push notification to ALL admin users when a new order is received.
    Called alongside send_order_notification after an order is created.
    Never raises — wrapped in try/except.
    """
    try:
        from django.contrib.auth import get_user_model
        from django.db.models import Q
        User = get_user_model()

        admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True)).distinct()
        if not admins.exists():
            logger.debug("No admin users found — skipping admin order alert")
            return

        customer_name = order.customer.username or order.customer.phone_number
        
        # Build detailed body with items
        items = order.items.all()
        items_str = ", ".join([f"{item.quantity}x {item.product_name}" for item in items])
        if len(items_str) > 100:
            items_str = items_str[:97] + "..."
            
        title = "🔔 New Order Received!"
        body = (
            f"Order #{order.order_number} - {customer_name}\n"
            f"Total: ₹{order.total_amount} ({order.get_payment_method_display()})\n"
            f"Items: {items_str}"
        )

        total_sent = 0
        for admin_user in admins:
            sent = send_push_to_user(
                user=admin_user,
                title=title,
                body=body,
                data={
                    'route': 'admin_orders',
                    'order_id': str(order.id),
                    'order_number': str(order.order_number),
                    'type': 'new_order_alert',
                },
            )
            total_sent += sent

        logger.info(
            f"Admin new-order alert sent to {total_sent} device(s) for order {order.order_number}"
        )
    except Exception as e:
        logger.error(f"send_admin_new_order_alert failed for order {order.id}: {e}")


def send_status_notification(order) -> None:
    """
    Send order status change push (Out for Delivery, Delivered, Cancelled).
    """
    try:
        status_messages = {
            'OUT_FOR_DELIVERY': ("🚚 Out for Delivery!", f"Order {order.order_number} is on its way to you."),
            'DELIVERED': ("📦 Delivered!", f"Order {order.order_number} delivered. Enjoy your fresh groceries!"),
            'CANCELLED': ("❌ Order Cancelled", f"Order {order.order_number} has been cancelled."),
            'UNDELIVERED': ("⚠️ Delivery Unsuccessful", f"Order {order.order_number} could not be delivered."),
        }
        msg = status_messages.get(order.status)
        if msg:
            send_push_to_user(
                user=order.customer,
                title=msg[0],
                body=msg[1],
                data={'route': 'orders', 'order_id': str(order.id)},
            )
    except Exception as e:
        logger.error(f"send_status_notification failed for order {order.id}: {e}")

def send_admin_email_alert(order) -> None:
    """
    Send an HTML email alert to the admin with full order details.
    """
    try:
        import os
        from django.core.mail import send_mail
        from django.conf import settings
        
        admin_email = os.getenv('ADMIN_EMAIL')
        if not admin_email:
            logger.debug("ADMIN_EMAIL not set — skipping admin email alert")
            return

        customer_name = order.customer.username or order.customer.phone_number
        customer_phone = order.customer.phone_number
        
        items = order.items.all()
        items_html = "<ul>"
        for item in items:
            items_html += f"<li><b>{item.quantity} {item.unit_name}</b> x {item.product_name} (₹{item.unit_price})</li>"
        items_html += "</ul>"

        subject = f"🔔 New Order #{order.order_number} Received!"
        message_plain = f"New order #{order.order_number} from {customer_name}. Total: ₹{order.total_amount}."
        
        message_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                <h2 style="color: #216140; border-bottom: 2px solid #216140; padding-bottom: 10px;">New Order Received!</h2>
                <p><strong>Order ID:</strong> #{order.order_number}</p>
                <p><strong>Customer:</strong> {customer_name} ({customer_phone})</p>
                <p><strong>Payment Method:</strong> {order.get_payment_method_display()}</p>
                <p><strong>Total Amount:</strong> ₹{order.total_amount}</p>
                
                <h3 style="margin-top: 20px;">Delivery Details:</h3>
                <p style="background: #f9f9f9; padding: 10px; border-radius: 4px;">{order.delivery_address}</p>
                
                <h3 style="margin-top: 20px;">Order Items:</h3>
                {items_html}
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Freshinbasket Auto-Generated Alert</p>
            </div>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message=message_plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            fail_silently=False,
            html_message=message_html
        )
        logger.info(f"Admin email alert sent to {admin_email} for order {order.order_number}")
    except Exception as e:
        logger.error(f"send_admin_email_alert failed for order {order.id}: {e}")
