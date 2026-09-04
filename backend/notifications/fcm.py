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


def send_push(token: str, title: str, body: str, data: dict = None, image_url: str = None) -> bool:
    """
    Send a single FCM push notification to a device token.
    Returns True if sent successfully, False otherwise.
    Never raises — caller should not be affected by notification failures.

    Args:
        image_url: Optional public HTTPS URL for a rich notification image.
                   Shown as big-picture on Android, attachment on iOS.
    """
    app = _get_app()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        # Build data payload, include image_url so the client can also use it
        payload = {k: str(v) for k, v in (data or {}).items()}
        if image_url:
            payload['image_url'] = image_url

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
                image=image_url,  # FCM native rich notification image
            ),
            data=payload,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='order_updates',
                    sound='default',
                    image=image_url,  # Android big-picture notification
                ),
            ),
            apns=messaging.APNSConfig(
                headers={'apns-priority': '10'},
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                        content_available=True,
                    ),
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


def send_bulk_push(tokens: list, title: str, body: str, data: dict = None, image_url: str = None):
    """
    Send a single FCM push notification to multiple device tokens (up to 500 per batch).
    Returns a tuple of (success_count, failure_count).
    """
    app = _get_app()
    if app is None:
        return 0, len(tokens)

    if not tokens:
        return 0, 0

    try:
        from firebase_admin import messaging

        payload = {k: str(v) for k, v in (data or {}).items()}
        if image_url:
            payload['image_url'] = image_url

        success_count = 0
        failure_count = 0

        # Chunk tokens into batches of 500 (FCM limit)
        for i in range(0, len(tokens), 500):
            batch_tokens = tokens[i:i + 500]
            
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                    image=image_url,
                ),
                data=payload,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        channel_id='order_updates',
                        sound='default',
                        image=image_url,
                    ),
                ),
                apns=messaging.APNSConfig(
                    headers={'apns-priority': '10'},
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1,
                            content_available=True,
                        ),
                    ),
                ),
                tokens=batch_tokens,
            )
            
            # send_each_for_multicast is preferred in v6.5.0+
            if hasattr(messaging, 'send_each_for_multicast'):
                response = messaging.send_each_for_multicast(message, app=app)
            else:
                response = messaging.send_multicast(message, app=app)
                
            success_count += response.success_count
            failure_count += response.failure_count
            
        logger.info(f"FCM bulk push sent: {title} | Success: {success_count}, Failed: {failure_count}")
        return success_count, failure_count
    except Exception as e:
        logger.error(f"FCM bulk push failed: {e}")
        return 0, len(tokens)


def send_push_to_user(user, title: str, body: str, data: dict = None, image_url: str = None) -> int:
    """
    Send a push notification to ALL active tokens of a user.
    Automatically removes stale/invalid tokens.
    Returns number of successful sends.

    Args:
        image_url: Optional public HTTPS URL for a rich notification image.
    """
    from .models import FCMToken, DeviceToken
    from firebase_admin import messaging as fb_messaging

    fcm_tokens = list(FCMToken.objects.filter(user=user))
    device_tokens = list(DeviceToken.objects.filter(user=user, is_active=True))

    if not fcm_tokens and not device_tokens:
        logger.debug(f"No FCM or Device tokens for user {user.id} — skipping push")
        return 0

    all_token_strings = {}
    for t in fcm_tokens:
        all_token_strings[t.token] = ('fcm', t)
    for t in device_tokens:
        all_token_strings[t.token] = ('device', t)

    sent = 0
    stale_fcm_tokens = []
    stale_device_tokens = []

    for token_str, (token_type, token_obj) in all_token_strings.items():
        try:
            success = send_push(token_str, title, body, data, image_url=image_url)
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
                if token_type == 'fcm':
                    stale_fcm_tokens.append(token_obj.id)
                else:
                    stale_device_tokens.append(token_obj.id)

    if stale_fcm_tokens:
        FCMToken.objects.filter(id__in=stale_fcm_tokens).delete()
        logger.info(f"Removed {len(stale_fcm_tokens)} stale FCM tokens for user {user.id}")

    if stale_device_tokens:
        DeviceToken.objects.filter(id__in=stale_device_tokens).update(is_active=False)
        logger.info(f"Deactivated {len(stale_device_tokens)} stale Device tokens for user {user.id}")

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

        from store.models import StoreSettings
        
        admins = list(User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True)).distinct())
        
        # Add the specific phone numbers if provided in Store Settings
        store_settings = StoreSettings.get_settings()
        if store_settings.admin_notification_phone:
            phones = [p.strip() for p in store_settings.admin_notification_phone.split(',') if p.strip()]
            for p in phones:
                specific_admin = User.objects.filter(phone_number=p).first()
                if specific_admin and specific_admin not in admins:
                    admins.append(specific_admin)

        if not admins:
            logger.debug("No admin users or admin_notification_phone found — skipping admin order alert")
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
        from store.models import StoreSettings
        
        store_settings = StoreSettings.get_settings()
        if not store_settings.admin_notification_email:
            logger.debug("admin_notification_email not set in DB — skipping admin email alert")
            return
            
        admin_emails = [e.strip() for e in store_settings.admin_notification_email.split(',') if e.strip()]
        if not admin_emails:
            logger.debug("No valid admin emails found — skipping admin email alert")
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
            recipient_list=admin_emails,
            fail_silently=False,
            html_message=message_html
        )
        logger.info(f"Admin email alert sent to {admin_email} for order {order.order_number}")
    except Exception as e:
        logger.error(f"send_admin_email_alert failed for order {order.id}: {e}")
