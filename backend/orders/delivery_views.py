from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
from .models import Order, DeliveryAssignment, Review
from .delivery.models import DeliveryLocation
from api.serializers import UserSerializer, UserUpdateSerializer
from django.db.models import Avg


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
            order__status__in=['CONFIRMED', 'OUT_FOR_DELIVERY']
        ).select_related('order', 'order__customer').first()

        active_delivery = None
        if active_assignment:
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
            'CONFIRMED': ['OUT_FOR_DELIVERY'],
            'OUT_FOR_DELIVERY': ['DELIVERED'],
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
        order.save()

        if new_status == 'DELIVERED':
            assignment.delivered_at = timezone.now()
            assignment.save()

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
        return Response(UserSerializer(user).data)

    def patch(self, request):
        user = request.user
        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)


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


