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


def send_status_notification(order) -> None:
    """
    Send order status change push (Out for Delivery, Delivered, Cancelled).
    """
    try:
        status_messages = {
            'OUT_FOR_DELIVERY': ("🚚 Out for Delivery!", f"Order {order.order_number} is on its way to you."),
            'DELIVERED': ("📦 Delivered!", f"Order {order.order_number} delivered. Enjoy your fresh groceries!"),
            'CANCELLED': ("❌ Order Cancelled", f"Order {order.order_number} has been cancelled."),
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
