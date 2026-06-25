from celery import shared_task
from orders.services.assignment_service import AssignmentService
import logging

logger = logging.getLogger(__name__)

@shared_task
def run_morning_assignment():
    logger.info("Running Morning Assignment")
    from orders.views import _get_delivery_slot
    current_slot = _get_delivery_slot()
    result = AssignmentService.run_assignment(current_slot)
    logger.info(f"Morning Assignment Result: {result}")
    return result

@shared_task
def run_evening_assignment():
    logger.info("Running Evening Assignment")
    result = AssignmentService.run_assignment('Evening Slot')
    logger.info(f"Evening Assignment Result: {result}")
    return result
