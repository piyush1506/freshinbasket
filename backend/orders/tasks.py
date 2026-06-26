import json
from celery import shared_task
from orders.services.assignment_service import AssignmentService
import logging

logger = logging.getLogger(__name__)


@shared_task
def run_slot_assignment(slot_label):
    logger.info(f"Running assignment for slot: {slot_label}")
    result = AssignmentService.run_assignment(slot_label)
    logger.info(f"Assignment result for {slot_label}: {result}")
    return result


@shared_task
def cleanup_slot_clusters(slot_label):
    logger.info(f"Cleaning up clusters for slot: {slot_label}")
    result = AssignmentService.cleanup_clusters_by_slot(slot_label)
    logger.info(f"Cleanup result for {slot_label}: {result}")
    return result


# Legacy task wrappers — kept for backward compatibility
@shared_task
def run_morning_assignment():
    return run_slot_assignment("7 AM - 12 PM")


@shared_task
def run_evening_assignment():
    return run_slot_assignment("4 PM - 10 PM")


@shared_task
def cleanup_morning_clusters():
    return cleanup_slot_clusters("7 AM - 12 PM")


@shared_task
def cleanup_evening_clusters():
    return cleanup_slot_clusters("4 PM - 10 PM")


@shared_task
def auto_assign_realtime_order(order_id):
    from orders.models import Order
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for real-time assignment")
        return {"status": "error", "message": "Order not found"}
    result = AssignmentService.assign_realtime_order(order)
    logger.info(f"Real-time assignment for order {order_id}: {result}")
    return result
