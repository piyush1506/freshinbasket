import logging
import os
import threading
import uuid
from datetime import timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler = None
_lock = threading.Lock()
_worker_id = f"worker-{os.getpid()}-{uuid.uuid4().hex[:6]}"


# ─────────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────────

def _with_db_cleanup(func, *args, **kwargs):
    """Ensure DB connections are properly managed for background threads."""
    from django.db import close_old_connections
    try:
        close_old_connections()
        return func(*args, **kwargs)
    finally:
        close_old_connections()


def _acquire_lock(job_name, timeout_minutes=10):
    """
    Try to acquire a database lock for a job.
    Returns True if acquired, False if another worker holds it.
    Expired locks (older than timeout_minutes) are auto-cleaned.
    """
    from orders.models import SchedulerLock
    from django.utils import timezone

    now = timezone.now()
    cutoff = now - timedelta(minutes=timeout_minutes)

    # Delete expired locks (crash protection)
    SchedulerLock.objects.filter(job_name=job_name, locked_at__lt=cutoff).delete()

    # Try to create a new lock (unique constraint prevents duplicates)
    try:
        SchedulerLock.objects.create(job_name=job_name, locked_by=_worker_id)
        return True
    except Exception:
        return False


def _release_lock(job_name):
    """Release a database lock for a job."""
    from orders.models import SchedulerLock
    try:
        SchedulerLock.objects.filter(job_name=job_name, locked_by=_worker_id).delete()
    except Exception:
        pass


# ─────────────────────────────────────────────────────────────
# Scheduled job functions
# ─────────────────────────────────────────────────────────────

def _run_batch_assignment(slot_label):
    """Run KMeans batch assignment for a delivery slot (with DB lock)."""
    lock_name = f"batch-{slot_label}"
    if not _acquire_lock(lock_name):
        logger.info(f"[Scheduler] Batch assignment for '{slot_label}' skipped — another worker is handling it.")
        return

    try:
        from orders.services.assignment_service import AssignmentService
        logger.info(f"[Scheduler] Running batch assignment for slot: {slot_label}")
        result = AssignmentService.run_assignment(slot_label)
        logger.info(f"[Scheduler] Batch assignment result for {slot_label}: {result}")
    except Exception as e:
        logger.error(f"[Scheduler] Batch assignment failed for {slot_label}: {e}", exc_info=True)
    finally:
        _release_lock(lock_name)


def _run_cleanup(slot_label):
    """Run cluster cleanup for a delivery slot (with DB lock)."""
    lock_name = f"cleanup-{slot_label}"
    if not _acquire_lock(lock_name):
        logger.info(f"[Scheduler] Cleanup for '{slot_label}' skipped — another worker is handling it.")
        return

    try:
        from orders.services.assignment_service import AssignmentService
        logger.info(f"[Scheduler] Running cleanup for slot: {slot_label}")
        result = AssignmentService.cleanup_clusters_by_slot(slot_label)
        logger.info(f"[Scheduler] Cleanup result for {slot_label}: {result}")
    except Exception as e:
        logger.error(f"[Scheduler] Cleanup failed for {slot_label}: {e}", exc_info=True)
    finally:
        _release_lock(lock_name)


def _run_safety_net():
    """
    Safety net: finds ALL unassigned confirmed orders and assigns them.
    Uses force=True to bypass time-based skip logic.
    Runs every 15 minutes — guarantees no order stays unassigned.
    """
    if not _acquire_lock("safety-net"):
        logger.info("[Scheduler] Safety net skipped — another worker is handling it.")
        return

    try:
        from orders.models import Order
        from orders.services.assignment_service import AssignmentService
        from django.db.models import Q

        unassigned = Order.objects.filter(
            Q(is_paid=True) | Q(payment_method=Order.PaymentMethod.COD),
            status=Order.Status.CONFIRMED,
            delivery_assignment__isnull=True,
            delivery_latitude__isnull=False,
            delivery_longitude__isnull=False,
        )

        count = unassigned.count()
        if count == 0:
            logger.info("[Scheduler] Safety net: no unassigned orders found.")
            return

        logger.info(f"[Scheduler] Safety net: found {count} unassigned order(s). Assigning...")

        assigned = 0
        for order in unassigned:
            try:
                result = AssignmentService.assign_realtime_order(order, force=True)
                if result.get('status') == 'success':
                    assigned += 1
                    logger.info(f"[Scheduler] Safety net: assigned order {order.order_number} — {result.get('message')}")
                else:
                    logger.warning(f"[Scheduler] Safety net: order {order.order_number} — {result.get('message')}")
            except Exception as e:
                logger.error(f"[Scheduler] Safety net: failed to assign order {order.order_number}: {e}")

        logger.info(f"[Scheduler] Safety net: assigned {assigned}/{count} order(s).")
    except Exception as e:
        logger.error(f"[Scheduler] Safety net failed: {e}", exc_info=True)
    finally:
        _release_lock("safety-net")


# ─────────────────────────────────────────────────────────────
# Scheduler management
# ─────────────────────────────────────────────────────────────

def reload_slot_schedules():
    """
    Read DeliverySlot configs from DB and update scheduler jobs.
    Called on startup and whenever a DeliverySlot is saved in admin.
    """
    global _scheduler
    if not _scheduler or not _scheduler.running:
        return

    from orders.models import DeliverySlot

    # Remove existing slot-based jobs (keep safety net)
    for job in _scheduler.get_jobs():
        if job.id.startswith('batch-') or job.id.startswith('cleanup-'):
            job.remove()

    # Add jobs for each active slot
    for slot in DeliverySlot.objects.filter(is_active=True):
        slot_key = slot.name.lower().replace(" ", "-")

        # Batch assignment job
        _scheduler.add_job(
            _with_db_cleanup,
            trigger=CronTrigger(hour=slot.assignment_hour, minute=slot.assignment_minute),
            args=[_run_batch_assignment, slot.display_label],
            id=f'batch-{slot_key}',
            name=f'Batch assignment for {slot.display_label}',
            replace_existing=True,
            max_instances=1,
        )

        # Cleanup job
        _scheduler.add_job(
            _with_db_cleanup,
            trigger=CronTrigger(hour=slot.cleanup_hour, minute=slot.cleanup_minute),
            args=[_run_cleanup, slot.display_label],
            id=f'cleanup-{slot_key}',
            name=f'Cleanup for {slot.display_label}',
            replace_existing=True,
            max_instances=1,
        )

        logger.info(
            f"[Scheduler] Scheduled '{slot.display_label}': "
            f"batch at {slot.assignment_hour}:{slot.assignment_minute:02d}, "
            f"cleanup at {slot.cleanup_hour}:{slot.cleanup_minute:02d}"
        )


def start_scheduler():
    """Start the APScheduler background scheduler. Safe to call multiple times."""
    global _scheduler

    with _lock:
        if _scheduler and _scheduler.running:
            return

        _scheduler = BackgroundScheduler()

        # Safety net: runs every 15 minutes
        _scheduler.add_job(
            _with_db_cleanup,
            trigger=IntervalTrigger(minutes=15),
            args=[_run_safety_net],
            id='safety-net',
            name='Safety net: assign unassigned orders',
            replace_existing=True,
            max_instances=1,
        )

        _scheduler.start()
        logger.info(f"[Scheduler] APScheduler started (worker: {_worker_id}).")

        # Load slot schedules from DB
        try:
            reload_slot_schedules()
        except Exception as e:
            logger.warning(f"[Scheduler] Could not load slot schedules on startup: {e}")


def get_scheduler():
    """Return the scheduler instance."""
    return _scheduler
