from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from orders.models import Order, DeliveryCluster, DeliveryAssignment
from users.models import User
from orders.services.assignment_service import AssignmentService
import json

@method_decorator(staff_member_required, name='dispatch')
class DeliveryDashboardView(View):
    def get(self, request):
        from django.db.models import Q
        paid_or_cod = Q(is_paid=True) | Q(payment_method=Order.PaymentMethod.COD)
        
        total_orders = Order.objects.filter(paid_or_cod, status__in=[Order.Status.CONFIRMED, Order.Status.OUT_FOR_DELIVERY, Order.Status.DELIVERED]).count()
        unassigned_orders = Order.objects.filter(paid_or_cod, status=Order.Status.CONFIRMED, delivery_assignment__isnull=True).count()
        assigned_orders = DeliveryAssignment.objects.filter(delivered_at__isnull=True).count()
        active_riders = User.objects.filter(role=User.Role.DELIVERY, delivery_profile__is_active=True).count()
        
        clusters = DeliveryCluster.objects.prefetch_related('assignments', 'assigned_delivery_boy').order_by('-assignment_date', 'cluster_number')
        
        # Prepare data for map
        map_clusters = []
        for cluster in clusters[:20]: # Show latest clusters
            map_clusters.append({
                'id': cluster.id,
                'number': cluster.cluster_number,
                'lat': float(cluster.center_latitude),
                'lng': float(cluster.center_longitude),
                'rider': cluster.assigned_delivery_boy.username if cluster.assigned_delivery_boy else 'Unassigned',
                'order_count': cluster.assignments.count()
            })
            
        unassigned_orders_qs = Order.objects.filter(
            paid_or_cod, status=Order.Status.CONFIRMED, delivery_assignment__isnull=True
        )
        map_orders = []
        for order in unassigned_orders_qs:
            if order.delivery_latitude and order.delivery_longitude:
                map_orders.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'lat': float(order.delivery_latitude),
                    'lng': float(order.delivery_longitude),
                    'assigned': False,
                    'rider': None
                })

        # Also show assigned orders on the map (green markers)
        assigned_orders_qs = Order.objects.filter(
            paid_or_cod,
            status__in=[Order.Status.CONFIRMED, Order.Status.OUT_FOR_DELIVERY],
            delivery_assignment__isnull=False
        ).select_related('delivery_assignment', 'delivery_assignment__delivery_boy')
        for order in assigned_orders_qs:
            if order.delivery_latitude and order.delivery_longitude:
                map_orders.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'lat': float(order.delivery_latitude),
                    'lng': float(order.delivery_longitude),
                    'assigned': True,
                    'rider': order.delivery_assignment.delivery_boy.username
                })

        context = {
            'total_orders': total_orders,
            'unassigned_orders': unassigned_orders,
            'assigned_orders': assigned_orders,
            'active_riders': active_riders,
            'clusters': clusters,
            'map_clusters_json': json.dumps(map_clusters),
            'map_orders_json': json.dumps(map_orders)
        }
        return render(request, 'admin/delivery_dashboard.html', context)

    def post(self, request):
        from django.contrib import messages
        action = request.POST.get('action')
        if action == 'run_assignment':
            from orders.views import _get_delivery_slot
            current_slot = _get_delivery_slot()
            slot_label = current_slot.display_label if current_slot else None
            result = AssignmentService.run_assignment(slot_label)
            if result.get('status') == 'error':
                messages.error(request, result.get('message'))
            else:
                messages.success(request, result.get('message'))
        return redirect('admin_delivery_dashboard')
