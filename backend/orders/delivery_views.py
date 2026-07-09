from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
from .models import Order, DeliveryAssignment, Review
from .delivery.models import DeliveryLocation
from api.serializers import UserSerializer, UserUpdateSerializer
from django.db.models import Avg
from notifications.fcm import send_status_notification


class IsDeliveryUser(permissions.BasePermission):
    """Only allow users with DELIVERY role."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'DELIVERY'
        )


class DeliveryDashboardView(APIView):
    """Dashboard stats for the delivery boy."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())

        # Today's completed deliveries
        today_assignments = DeliveryAssignment.objects.filter(
            delivery_boy=user,
            assigned_at__date=today
        )
        today_delivered = today_assignments.filter(
            order__status='DELIVERED'
        ).count()

        # Today's earnings (₹30 per delivery as commission)
        today_earnings = today_delivered * 30.00

        # This week stats
        week_assignments = DeliveryAssignment.objects.filter(
            delivery_boy=user,
            assigned_at__date__gte=week_start
        )
        week_delivered = week_assignments.filter(
            order__status='DELIVERED'
        ).count()
        week_earnings = week_delivered * 30.00

        # Total deliveries
        total_delivered = DeliveryAssignment.objects.filter(
            delivery_boy=user,
            order__status='DELIVERED'
        ).count()

        # Active delivery
        active_assignment = DeliveryAssignment.objects.filter(
            delivery_boy=user,
            order__status='OUT_FOR_DELIVERY'
        ).select_related('order', 'order__customer', 'cluster').first()

        active_delivery = None
        if active_assignment:
            cluster = active_assignment.cluster
            completed_in_cluster = 0
            if cluster:
                completed_in_cluster = DeliveryAssignment.objects.filter(
                    cluster=cluster, delivered_at__isnull=False
                ).count()
            order = active_assignment.order
            items = order.items.all()
            active_delivery = {
                'assignment_id': active_assignment.id,
                'order_id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer.username,
                'customer_phone': order.customer.phone_number or '',
                'delivery_address': order.delivery_address,
                'delivery_latitude': str(order.delivery_latitude) if order.delivery_latitude else None,
                'delivery_longitude': str(order.delivery_longitude) if order.delivery_longitude else None,
                'status': order.status,
                'subtotal': str(order.subtotal),
                'delivery_charge': str(order.delivery_charge),
                'total_amount': str(order.total_amount),
                'is_paid': order.is_paid,
                'payment_method': order.payment_method,
                'items': [
                    {
                        'id': item.id,
                        'product_name': item.product_name,
                        'quantity': item.quantity,
                        'unit_name': item.unit_name or 'kg',
                        'unit_price': str(item.unit_price),
                        'total_price': str(item.total_price),
                    }
                    for item in items
                ],
                'notes': active_assignment.notes or '',
                'assigned_at': active_assignment.assigned_at.isoformat(),
                'group_name': cluster.group_name if cluster and cluster.group_name else (cluster.delivery_slot if cluster else order.delivery_slot),
                'stop_number': completed_in_cluster + 1,
            }

        avg = Review.objects.filter(
            order__delivery_assignment__delivery_boy=user,
            order__status='DELIVERED'
        ).aggregate(avg=Avg('rating'))['avg']

        return Response({
            'driver_name': user.username,
            'today_earnings': today_earnings,
            'today_deliveries': today_delivered,
            'week_earnings': week_earnings,
            'week_deliveries': week_delivered,
            'total_deliveries': total_delivered,
            'avg_rating': round(float(avg), 2) if avg else 0,
            'active_delivery': active_delivery,
        })


class DeliveryAssignedOrdersView(APIView):
    """List all orders assigned to this delivery boy."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user
        status_filter = request.query_params.get('status', None)

        assignments = DeliveryAssignment.objects.filter(
            delivery_boy=user
        ).select_related('order', 'order__customer').order_by('-assigned_at')

        if status_filter:
            assignments = assignments.filter(order__status=status_filter)

        orders_list = []
        for assignment in assignments:
            order = assignment.order
            items = order.items.all()
            orders_list.append({
                'assignment_id': assignment.id,
                'order_id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer.username,
                'customer_phone': order.customer.phone_number or '',
                'delivery_address': order.delivery_address,
                'delivery_latitude': str(order.delivery_latitude) if order.delivery_latitude else None,
                'delivery_longitude': str(order.delivery_longitude) if order.delivery_longitude else None,
                'status': order.status,
                'subtotal': str(order.subtotal),
                'delivery_charge': str(order.delivery_charge),
                'total_amount': str(order.total_amount),
                'is_paid': order.is_paid,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat(),
                'assigned_at': assignment.assigned_at.isoformat(),
                'delivered_at': assignment.delivered_at.isoformat() if assignment.delivered_at else None,
                'notes': assignment.notes or '',
                'items': [
                    {
                        'id': item.id,
                        'product_name': item.product_name,
                        'quantity': item.quantity,
                        'unit_name': item.unit_name or 'kg',
                        'unit_price': str(item.unit_price),
                        'total_price': str(item.total_price),
                    }
                    for item in items
                ],
            })

        return Response(orders_list)


class DeliveryUpdateStatusView(APIView):
    """Update an order's delivery status."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def patch(self, request, order_id):
        user = request.user
        new_status = request.data.get('status')

        valid_transitions = {
            'PENDING': ['OUT_FOR_DELIVERY'],
            'CONFIRMED': ['OUT_FOR_DELIVERY'],
            'OUT_FOR_DELIVERY': ['DELIVERED', 'UNDELIVERED'],
        }

        try:
            assignment = DeliveryAssignment.objects.get(
                delivery_boy=user,
                order_id=order_id
            )
        except DeliveryAssignment.DoesNotExist:
            return Response(
                {'error': 'Assignment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        order = assignment.order
        allowed = valid_transitions.get(order.status, [])

        if new_status not in allowed:
            return Response(
                {'error': f'Cannot transition from {order.status} to {new_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        if new_status == 'UNDELIVERED':
            order.undelivered_reason = request.data.get('reason', '')
        order.save()

        if new_status == 'DELIVERED':
            assignment.delivered_at = timezone.now()
            assignment.save()

        # ── Notify customer about status change (Out for Delivery / Delivered) ─
        try:
            send_status_notification(order)
        except Exception as e:
            logger.warning("FCM status notification failed for order %s: %s", order.id, e)

        return Response({
            'message': f'Order status updated to {new_status}',
            'order_id': order.id,
            'status': order.status,
        })


class DeliveryEarningsView(APIView):
    """Detailed earnings breakdown for the delivery driver."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # Per-delivery commission
        COMMISSION = 30.00

        # Daily breakdown for the past 7 days
        daily = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = DeliveryAssignment.objects.filter(
                delivery_boy=user,
                order__status='DELIVERED',
                delivered_at__date=day
            ).count()
            daily.append({
                'date': day.isoformat(),
                'day_name': day.strftime('%a'),
                'deliveries': count,
                'earnings': count * COMMISSION,
            })

        # Monthly totals
        month_start = today.replace(day=1)
        month_count = DeliveryAssignment.objects.filter(
            delivery_boy=user,
            order__status='DELIVERED',
            delivered_at__date__gte=month_start
        ).count()

        total_count = DeliveryAssignment.objects.filter(
            delivery_boy=user,
            order__status='DELIVERED'
        ).count()

        return Response({
            'commission_per_delivery': COMMISSION,
            'daily_breakdown': daily,
            'this_month': {
                'deliveries': month_count,
                'earnings': month_count * COMMISSION,
            },
            'all_time': {
                'deliveries': total_count,
                'earnings': total_count * COMMISSION,
            },
        })


class DeliveryUpdateProfileView(APIView):
    """Get and update the delivery boy's profile details."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        from users.models import DeliveryProfile
        profile, _ = DeliveryProfile.objects.get_or_create(user=user)
        data['is_active'] = profile.is_active
        return Response(data)

    def patch(self, request):
        user = request.user
        data = request.data.copy()
        is_active = data.pop('is_active', None)

        serializer = UserUpdateSerializer(
            user,
            data=data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        from users.models import DeliveryProfile
        profile, _ = DeliveryProfile.objects.get_or_create(user=user)
        if is_active is not None:
            if isinstance(is_active, str):
                profile.is_active = is_active.lower() == 'true'
            else:
                profile.is_active = bool(is_active)
            profile.save()

        res_data = UserSerializer(user).data
        res_data['is_active'] = profile.is_active
        return Response(res_data)


class UpdateDeliveryLocationView(APIView):
    """Update the delivery boy's current live location."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]

    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        if latitude is None or longitude is None:
            return Response({'error': 'latitude and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)
        DeliveryLocation.objects.update_or_create(
            delivery_boy=request.user,
            defaults={'latitude': latitude, 'longitude': longitude}
        )
        return Response({'status': 'ok'})




class DeliveryGroupsView(APIView):
    """List delivery groups (clusters) assigned to the delivery boy."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user
        
        # Get all clusters assigned to this user that have active assignments
        assignments = DeliveryAssignment.objects.filter(
            delivery_boy=user
        ).select_related('order', 'cluster', 'order__customer').order_by('-assigned_at')
        
        groups_dict = {}
        for assignment in assignments:
            cluster = assignment.cluster
            if cluster:
                group_id = f"C{cluster.id}"
                slot = cluster.delivery_slot
                date = cluster.assignment_date.isoformat()
                group_name = cluster.group_name if cluster.group_name else slot
            else:
                # Fallback for old manual assignments without cluster
                group_id = f"O{assignment.id}"
                slot = assignment.order.delivery_slot
                date = assignment.assigned_at.date().isoformat()
                group_name = slot
                
            if group_id not in groups_dict:
                groups_dict[group_id] = {
                    'group_id': group_id,
                    'delivery_slot': slot,
                    'group_name': group_name,
                    'date': date,
                    'total_orders': 0,
                    'delivered_count': 0,
                    'undelivered_count': 0,
                    'pending_count': 0,
                    'cod_collected': 0.0,
                    'orders': [],
                    'is_active': False
                }
                
            g = groups_dict[group_id]
            g['total_orders'] += 1
            
            order = assignment.order
            if order.status == 'DELIVERED':
                g['delivered_count'] += 1
                if order.payment_method == 'COD':
                    g['cod_collected'] += float(order.total_amount)
            elif order.status == 'UNDELIVERED':
                g['undelivered_count'] += 1
            else:
                g['pending_count'] += 1
                g['is_active'] = True
                
            items = order.items.all()
            g['orders'].append({
                'assignment_id': assignment.id,
                'order_id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer.username,
                'customer_phone': order.customer.phone_number or '',
                'delivery_address': order.delivery_address,
                'delivery_latitude': str(order.delivery_latitude) if order.delivery_latitude else None,
                'delivery_longitude': str(order.delivery_longitude) if order.delivery_longitude else None,
                'status': order.status,
                'subtotal': str(order.subtotal),
                'delivery_charge': str(order.delivery_charge),
                'total_amount': str(order.total_amount),
                'is_paid': order.is_paid,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat(),
                'assigned_at': assignment.assigned_at.isoformat(),
                'notes': assignment.notes or '',
                'items': [
                    {
                        'id': item.id,
                        'product_name': item.product_name,
                        'quantity': item.quantity,
                        'unit_name': item.unit_name or 'kg',
                        'unit_price': str(item.unit_price),
                        'total_price': str(item.total_price),
                    } for item in items
                ]
            })

        active_groups = [g for g in groups_dict.values() if g['is_active']]
        past_groups = [g for g in groups_dict.values() if not g['is_active']]
        
        return Response({
            'active_groups': active_groups,
            'past_groups': past_groups
        })


class DeliveryStatsView(APIView):
    """Order counts and COD totals for the delivery driver (no earnings)."""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryUser]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        def get_stats_for_queryset(qs):
            total = qs.count()
            delivered = qs.filter(order__status='DELIVERED').count()
            undelivered = qs.filter(order__status='UNDELIVERED').count()
            pending = total - delivered - undelivered
            
            # Calculate COD only for DELIVERED
            cod_collected = qs.filter(
                order__status='DELIVERED', 
                order__payment_method='COD'
            ).aggregate(total=Sum('order__total_amount'))['total'] or 0.0
            
            return {
                'total_orders': total,
                'delivered': delivered,
                'undelivered': undelivered,
                'pending': pending,
                'cod_collected': float(cod_collected)
            }
            
        today_qs = DeliveryAssignment.objects.filter(delivery_boy=user, assigned_at__date=today)
        week_qs = DeliveryAssignment.objects.filter(delivery_boy=user, assigned_at__date__gte=week_start)
        month_qs = DeliveryAssignment.objects.filter(delivery_boy=user, assigned_at__date__gte=month_start)
        
        daily_breakdown = []
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            day_qs = DeliveryAssignment.objects.filter(delivery_boy=user, assigned_at__date=day)
            stats = get_stats_for_queryset(day_qs)
            stats['date'] = day.isoformat()
            stats['day'] = day.strftime('%a')
            daily_breakdown.append(stats)
            
        monthly_breakdown = []
        for i in range(5, -1, -1):
            m_date = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            next_m = (m_date + timedelta(days=32)).replace(day=1)
            m_qs = DeliveryAssignment.objects.filter(
                delivery_boy=user, 
                assigned_at__date__gte=m_date,
                assigned_at__date__lt=next_m
            )
            stats = get_stats_for_queryset(m_qs)
            stats['month'] = m_date.strftime('%Y-%m')
            stats['label'] = m_date.strftime('%B %Y')
            monthly_breakdown.append(stats)

        return Response({
            'today': get_stats_for_queryset(today_qs),
            'this_week': get_stats_for_queryset(week_qs),
            'this_month': get_stats_for_queryset(month_qs),
            'daily_breakdown': daily_breakdown,
            'monthly_breakdown': monthly_breakdown
        })
