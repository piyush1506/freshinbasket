from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_order_notification_task(order_id):
    from orders.models import Order
    from notifications.fcm import send_order_notification
    try:
        order = Order.objects.get(id=order_id)
        send_order_notification(order)
    except Exception as e:
        logger.error(f"Failed to send order notification for order {order_id}: {e}")
