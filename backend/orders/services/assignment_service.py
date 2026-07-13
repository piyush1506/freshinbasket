import logging
from django.db import transaction
from django.utils import timezone
from sklearn.cluster import KMeans
import numpy as np

from users.models import User
from orders.models import Order, DeliveryCluster, DeliveryAssignment

logger = logging.getLogger(__name__)


class AssignmentService:

    LOAD_BALANCE_FACTOR = 5.0

    @staticmethod
    def get_eligible_orders(delivery_slot=None):
        from django.db.models import Q
        qs = Order.objects.filter(
            Q(is_paid=True) | Q(payment_method=Order.PaymentMethod.COD),
            status=Order.Status.CONFIRMED,
            delivery_latitude__isnull=False,
            delivery_longitude__isnull=False,
            delivery_assignment__isnull=True
        )
        if delivery_slot:
            from orders.models import DeliverySlot
            current = DeliverySlot.objects.filter(display_label=delivery_slot).first()
            if current:
                earlier = DeliverySlot.objects.filter(
                    sort_order__lte=current.sort_order,
                    is_active=True
                ).values_list('display_label', flat=True)
                qs = qs.filter(delivery_slot__in=list(earlier))
            else:
                qs = qs.filter(delivery_slot=delivery_slot)
        return qs

    @staticmethod
    def get_active_riders():
        riders = User.objects.filter(
            role=User.Role.DELIVERY,
            delivery_profile__is_active=True
        ).select_related('delivery_profile')

        if not riders.exists():
            all_delivery_users = User.objects.filter(role=User.Role.DELIVERY)
            from users.models import DeliveryProfile
            for u in all_delivery_users:
                DeliveryProfile.objects.get_or_create(user=u, defaults={'is_active': True})
            riders = User.objects.filter(
                role=User.Role.DELIVERY,
                delivery_profile__is_active=True
            ).select_related('delivery_profile')

        return riders

    @classmethod
    def _pick_lowest_load_rider(cls, rider_list, load_dict, exclude=None):
        candidates = [r for r in rider_list if r.id != exclude]
        if not candidates:
            return None
        return min(candidates, key=lambda r: load_dict.get(r.id, 0))

    @classmethod
    @transaction.atomic
    def run_assignment(cls, delivery_slot):
        orders = cls.get_eligible_orders(delivery_slot)
        riders = cls.get_active_riders()

        if not orders.exists():
            return {"status": "success", "message": "No eligible orders to assign."}

        if not riders.exists():
            return {"status": "error", "message": "No active riders available."}

        k = riders.count()
        order_list = list(orders)

        coords = np.array([
            [float(order.delivery_latitude), float(order.delivery_longitude)]
            for order in order_list
        ])

        n_clusters = min(k, len(order_list))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        kmeans.fit(coords)

        labels = kmeans.labels_
        centers = kmeans.cluster_centers_

        rider_list = list(riders)
        assignments_created = 0

        rider_load = {
            r.id: DeliveryAssignment.objects.filter(
                delivery_boy=r, delivered_at__isnull=True
            ).count()
            for r in rider_list
        }

        for cluster_idx in range(len(centers)):
            center_lat, center_lon = centers[cluster_idx]

            rider = cls._pick_lowest_load_rider(rider_list, rider_load)

            cluster_record = DeliveryCluster.objects.create(
                delivery_slot=delivery_slot,
                cluster_number=cluster_idx + 1,
                center_latitude=center_lat,
                center_longitude=center_lon,
                assigned_delivery_boy=rider
            )

            cluster_orders = [order_list[i] for i in range(len(order_list)) if labels[i] == cluster_idx]

            for order in cluster_orders:
                max_orders = rider.delivery_profile.max_orders if hasattr(rider, 'delivery_profile') and rider.delivery_profile else 40

                if rider_load[rider.id] >= max_orders:
                    fallback = cls._pick_lowest_load_rider(
                        rider_list, rider_load,
                        exclude=rider.id
                    )
                    if fallback and rider_load.get(fallback.id, 0) < (
                        fallback.delivery_profile.max_orders if hasattr(fallback, 'delivery_profile') and fallback.delivery_profile else 40
                    ):
                        assignee = fallback
                        rider_load[fallback.id] += 1
                    else:
                        logger.warning(f"All riders at capacity! Cannot assign order {order.id}")
                        continue
                else:
                    assignee = rider
                    rider_load[rider.id] += 1

                DeliveryAssignment.objects.create(
                    order=order,
                    delivery_boy=assignee,
                    cluster=cluster_record,
                    notes='Auto-assigned by batch clustering.'
                )
                assignments_created += 1

        return {
            "status": "success",
            "message": f"Successfully created {assignments_created} assignments across {len(centers)} clusters."
        }

    @staticmethod
    @transaction.atomic
    def cleanup_clusters_by_slot(delivery_slot):
        today = timezone.now().date()
        all_clusters = DeliveryCluster.objects.filter(
            assignment_date=today,
            delivery_slot=delivery_slot
        )
        total = all_clusters.count()
        deleted = 0
        skipped = 0
        for cluster in all_clusters:
            has_active = cluster.assignments.filter(delivered_at__isnull=True).exists()
            if has_active:
                skipped += 1
            else:
                cluster.delete()
                deleted += 1
        logger.info(f"Cleaned up {deleted} clusters for slot '{delivery_slot}' ({skipped} skipped — active orders)")
        return {"status": "success", "message": f"Cleaned up {deleted} clusters, {skipped} skipped (active orders pending)"}

    @classmethod
    @transaction.atomic
    def assign_realtime_order(cls, order, force=False):
        if order.status != Order.Status.CONFIRMED or not (order.is_paid or order.payment_method == Order.PaymentMethod.COD):
            return {"status": "error", "message": "Order not eligible"}

        if not order.delivery_latitude or not order.delivery_longitude:
            return {"status": "error", "message": "Order missing coordinates"}

        # Time-based assignment logic (skipped when force=True for safety net):
        if not force:
            # Only assign instantly if we are past the batch assignment time for today's slot.
            from orders.models import DeliverySlot
            import datetime
            slot_obj = DeliverySlot.objects.filter(display_label=order.delivery_slot).first()
            if slot_obj:
                now_time = timezone.localtime(timezone.now()).time()
                assignment_time = datetime.time(slot_obj.assignment_hour, slot_obj.assignment_minute)
                
                # If the current time is past the order cutoff, this order is for tomorrow's slot.
                if now_time > slot_obj.order_cutoff_time:
                    return {"status": "skipped", "message": "Order is for tomorrow, will be bulk assigned."}
                    
                # If we haven't reached the batch assignment time yet today, let the batch job handle it.
                if now_time < assignment_time:
                    return {"status": "skipped", "message": "Will be bulk assigned before delivery window opens."}

        order_lat = float(order.delivery_latitude)
        order_lon = float(order.delivery_longitude)
        slot = order.delivery_slot
        today = timezone.now().date()

        riders = cls.get_active_riders()
        if not riders.exists():
            return {"status": "error", "message": "No active riders available"}

        rider_list = list(riders)
        rider_load = {
            r.id: DeliveryAssignment.objects.filter(
                delivery_boy=r, delivered_at__isnull=True
            ).count()
            for r in rider_list
        }

        clusters = DeliveryCluster.objects.filter(
            assignment_date=today,
            delivery_slot=slot
        )

        # Find nearest cluster to link the assignment
        nearest_cluster = None
        min_sq_dist = float('inf')
        for cluster in clusters:
            c_lat = float(cluster.center_latitude)
            c_lon = float(cluster.center_longitude)
            sq_dist = (order_lat - c_lat) ** 2 + (order_lon - c_lon) ** 2
            if sq_dist < min_sq_dist:
                min_sq_dist = sq_dist
                nearest_cluster = cluster

        # Attempt to assign to the rider who is handling the geographically nearest cluster
        best_rider = None
        if nearest_cluster and nearest_cluster.assigned_delivery_boy:
            candidate = nearest_cluster.assigned_delivery_boy
            max_orders = candidate.delivery_profile.max_orders if hasattr(candidate, 'delivery_profile') and candidate.delivery_profile else 40
            if rider_load.get(candidate.id, 0) < max_orders:
                best_rider = candidate

        # If the nearest rider is full, or no cluster exists, fall back to the lowest loaded rider
        if not best_rider:
            best_rider = cls._pick_lowest_load_rider(rider_list, rider_load)

        if not best_rider:
            return {"status": "error", "message": "No suitable rider found"}

        DeliveryAssignment.objects.create(
            order=order,
            delivery_boy=best_rider,
            cluster=nearest_cluster if nearest_cluster and nearest_cluster.assigned_delivery_boy == best_rider else None,
            notes='Real-time assigned by load balance and cluster proximity.'
        )

        return {"status": "success", "message": f"Assigned to {best_rider.username}"}
