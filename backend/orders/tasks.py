import logging
from orders.services.assignment_service import AssignmentService

logger = logging.getLogger(__name__)


def run_slot_assignment(slot_label):
    """Run batch assignment for a delivery slot."""
    logger.info(f"Running assignment for slot: {slot_label}")
    result = AssignmentService.run_assignment(slot_label)
    logger.info(f"Assignment result for {slot_label}: {result}")
    return result


def cleanup_slot_clusters(slot_label):
    """Run cluster cleanup for a delivery slot."""
    logger.info(f"Cleaning up clusters for slot: {slot_label}")
    result = AssignmentService.cleanup_clusters_by_slot(slot_label)
    logger.info(f"Cleanup result for {slot_label}: {result}")
    return result


# Legacy function wrappers — kept for backward compatibility
def run_morning_assignment():
    return run_slot_assignment("7 AM - 12 PM")


def run_evening_assignment():
    return run_slot_assignment("4 PM - 10 PM")


def cleanup_morning_clusters():
    return cleanup_slot_clusters("7 AM - 12 PM")


def cleanup_evening_clusters():
    return cleanup_slot_clusters("4 PM - 10 PM")


def auto_assign_realtime_order(order_id):
    """Assign a single order to a rider in real-time."""
    from orders.models import Order
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for real-time assignment")
        return {"status": "error", "message": "Order not found"}
    result = AssignmentService.assign_realtime_order(order)
    logger.info(f"Real-time assignment for order {order_id}: {result}")
    return result
