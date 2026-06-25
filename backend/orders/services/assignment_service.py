import logging
from django.db import transaction
from django.utils import timezone
from sklearn.cluster import KMeans
import numpy as np

from users.models import User
from orders.models import Order, DeliveryCluster, DeliveryAssignment

logger = logging.getLogger(__name__)

class AssignmentService:
    
    @staticmethod
    def get_eligible_orders():
        from django.db.models import Q
        # Confirmed, Paid OR Cash on Delivery, Has Coordinates, Not already assigned
        return Order.objects.filter(
            Q(is_paid=True) | Q(payment_method=Order.PaymentMethod.COD),
            status=Order.Status.CONFIRMED,
            delivery_latitude__isnull=False,
            delivery_longitude__isnull=False,
            delivery_assignment__isnull=True
        )
        
    @staticmethod
    def get_active_riders():
        # Primary: Get delivery boys with an active profile
        riders = User.objects.filter(
            role=User.Role.DELIVERY,
            delivery_profile__is_active=True
        ).select_related('delivery_profile')

        # Fallback: If no profiled riders found, get all DELIVERY users
        # and auto-create their profiles so the assignment can proceed
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
    @transaction.atomic
    def run_assignment(cls, delivery_slot):
        orders = cls.get_eligible_orders()
        riders = cls.get_active_riders()
        
        if not orders.exists():
            return {"status": "success", "message": "No eligible orders to assign."}
            
        if not riders.exists():
            return {"status": "error", "message": "No active riders available."}
            
        k = riders.count()
        order_list = list(orders)
        
        # Prepare coordinates
        coords = np.array([
            [float(order.delivery_latitude), float(order.delivery_longitude)] 
            for order in order_list
        ])
        
        # Run KMeans
        n_clusters = min(k, len(order_list))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        kmeans.fit(coords)
        
        labels = kmeans.labels_
        centers = kmeans.cluster_centers_
        
        # Distribute clusters to riders
        rider_list = list(riders)
        
        assignments_created = 0

        # Pre-count current active assignments per rider for fair load balancing
        from django.db.models import Count
        rider_load = {
            r.id: DeliveryAssignment.objects.filter(
                delivery_boy=r, delivered_at__isnull=True
            ).count()
            for r in rider_list
        }

        for cluster_idx in range(len(centers)):
            center_lat, center_lon = centers[cluster_idx]

            from orders.utils import haversine_distance

            def get_rider_score(r):
                profile = getattr(r, 'delivery_profile', None)
                if profile and profile.current_latitude and profile.current_longitude:
                    # Rider has coordinates: primary sort by distance, secondary by load
                    dist = haversine_distance(
                        float(profile.current_latitude),
                        float(profile.current_longitude),
                        center_lat,
                        center_lon
                    )
                    return (0, dist, rider_load.get(r.id, 0))
                else:
                    # No coordinates: push to bottom priority, but sort by load among themselves
                    return (1, 0, rider_load.get(r.id, 0))

            # Pick the nearest rider (or least loaded if coordinates are missing)
            rider = min(rider_list, key=get_rider_score)
            
            # Create cluster record
            cluster_record = DeliveryCluster.objects.create(
                delivery_slot=delivery_slot,
                cluster_number=cluster_idx + 1,
                center_latitude=center_lat,
                center_longitude=center_lon,
                assigned_delivery_boy=rider
            )
            
            # Assign orders in this cluster
            cluster_orders = [order_list[i] for i in range(len(order_list)) if labels[i] == cluster_idx]
            
            for order in cluster_orders:
                # Capacity check
                current_assigned_count = DeliveryAssignment.objects.filter(
                    delivery_boy=rider, 
                    delivered_at__isnull=True
                ).count()
                
                current_assigned_count = rider_load[rider.id]
                max_orders = rider.delivery_profile.max_orders if hasattr(rider, 'delivery_profile') else 40
                
                if current_assigned_count >= max_orders:
                    # Rider full, fallback to next available rider
                    fallback_rider = None
                    for r in rider_list:
                        r_count = DeliveryAssignment.objects.filter(
                            delivery_boy=r, delivered_at__isnull=True
                        ).count()
                        r_max = r.delivery_profile.max_orders if hasattr(r, 'delivery_profile') else 40
                        if r_count < r_max:
                            fallback_rider = r
                            break
                            
                    if fallback_rider:
                        assignee = fallback_rider
                        # Also update the fallback rider's load in our dict
                        rider_load[fallback_rider.id] += 1
                    else:
                        logger.warning(f"All riders are at maximum capacity! Cannot assign order {order.id}")
                        continue
                else:
                    assignee = rider
                    # Increment the primary rider's load
                    rider_load[rider.id] += 1

                DeliveryAssignment.objects.create(
                    order=order,
                    delivery_boy=assignee,
                    cluster=cluster_record,
                    notes='Auto-assigned by batch clustering.'
                )
                order.status = Order.Status.OUT_FOR_DELIVERY
                order.save(update_fields=['status'])
                assignments_created += 1
                
        return {
            "status": "success", 
            "message": f"Successfully created {assignments_created} assignments across {len(centers)} clusters."
        }
        
    @classmethod
    @transaction.atomic
    def assign_realtime_order(cls, order):
        if order.status != Order.Status.CONFIRMED or not (order.is_paid or order.payment_method == Order.PaymentMethod.COD):
            return {"status": "error", "message": "Order not eligible"}
            
        if not order.delivery_latitude or not order.delivery_longitude:
            return {"status": "error", "message": "Order missing coordinates"}
            
        today = timezone.now().date()
        clusters = DeliveryCluster.objects.filter(assignment_date=today)
        
        if not clusters.exists():
            return {"status": "error", "message": "No clusters available for today. Run batch assignment first."}
            
        # Find nearest cluster center
        min_dist = float('inf')
        nearest_cluster = None
        
        order_lat = float(order.delivery_latitude)
        order_lon = float(order.delivery_longitude)
        
        for cluster in clusters:
            c_lat = float(cluster.center_latitude)
            c_lon = float(cluster.center_longitude)
            dist = (order_lat - c_lat)**2 + (order_lon - c_lon)**2
            if dist < min_dist:
                min_dist = dist
                nearest_cluster = cluster
                
        if nearest_cluster and nearest_cluster.assigned_delivery_boy:
            DeliveryAssignment.objects.create(
                order=order,
                delivery_boy=nearest_cluster.assigned_delivery_boy,
                cluster=nearest_cluster
            )
            order.status = Order.Status.OUT_FOR_DELIVERY
            order.save(update_fields=['status'])
            return {"status": "success", "message": f"Assigned to {nearest_cluster.assigned_delivery_boy.username}"}
            
        return {"status": "error", "message": "Failed to find suitable cluster"}
