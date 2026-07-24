from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib import messages
from django.db import transaction
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem, DeliverySlot
from store.models import Product, StoreSettings

User = get_user_model()


@method_decorator(staff_member_required, name='dispatch')
class CreateTestOrderView(View):
    def get(self, request):
        users = User.objects.filter(is_active=True).order_by('username', 'phone_number')
        products = Product.objects.filter(is_active=True).select_related('unit').order_by('name')
        slots = DeliverySlot.objects.filter(is_active=True).order_by('sort_order')
        
        context = dict(
            title="Create Test Order (No Notifications)",
            users=users,
            products=products,
            slots=slots,
            opts=Order._meta,
        )
        return render(request, 'admin/orders/test_order.html', context)

    def post(self, request):
        customer_id = request.POST.get('customer_id')
        delivery_address = request.POST.get('delivery_address', '').strip()
        lat_str = request.POST.get('delivery_latitude', '').strip()
        lng_str = request.POST.get('delivery_longitude', '').strip()
        payment_method = request.POST.get('payment_method', Order.PaymentMethod.COD)
        is_paid = request.POST.get('is_paid') == 'on'
        slot_id = request.POST.get('slot_id')
        delivery_charge_str = request.POST.get('delivery_charge', '0.00').strip()

        product_ids = request.POST.getlist('product_ids[]')
        quantities = request.POST.getlist('quantities[]')

        if not customer_id:
            messages.error(request, "Please select a customer.")
            return redirect('admin_create_test_order')

        customer = User.objects.filter(id=customer_id).first()
        if not customer:
            messages.error(request, "Selected customer does not exist.")
            return redirect('admin_create_test_order')

        if not delivery_address:
            delivery_address = customer.address or "Test Delivery Address, Main Road, City"

        try:
            delivery_latitude = float(lat_str) if lat_str else None
        except ValueError:
            delivery_latitude = None

        try:
            delivery_longitude = float(lng_str) if lng_str else None
        except ValueError:
            delivery_longitude = None

        slot = DeliverySlot.objects.filter(id=slot_id).first() if slot_id else None
        slot_label = slot.display_label if slot else "7 AM - 12 PM (Test Slot)"

        try:
            delivery_charge = float(delivery_charge_str) if delivery_charge_str else 0.0
        except ValueError:
            delivery_charge = 0.0

        # Filter valid items
        valid_items = []
        subtotal = 0.0

        for pid, qty_str in zip(product_ids, quantities):
            if not pid or not qty_str:
                continue
            try:
                qty = float(qty_str)
                if qty <= 0:
                    continue
                product = Product.objects.filter(id=pid).first()
                if product:
                    item_price = float(product.price)
                    item_total = item_price * qty
                    subtotal += item_total
                    valid_items.append({
                        'product': product,
                        'quantity': qty,
                        'unit_price': item_price,
                        'unit_name': product.unit.name if product.unit else 'kg'
                    })
            except ValueError:
                continue

        if not valid_items:
            messages.error(request, "Please select at least one valid product with a quantity greater than 0.")
            return redirect('admin_create_test_order')

        total_amount = subtotal + delivery_charge

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    customer=customer,
                    status=Order.Status.CONFIRMED,
                    delivery_address=delivery_address,
                    delivery_latitude=delivery_latitude,
                    delivery_longitude=delivery_longitude,
                    delivery_slot=slot_label,
                    delivery_slot_ref=slot,
                    subtotal=subtotal,
                    delivery_charge=delivery_charge,
                    total_amount=total_amount,
                    is_paid=is_paid,
                    payment_method=payment_method,
                    is_test_order=True  # Flagged as test order
                )

                for item in valid_items:
                    OrderItem.objects.create(
                        order=order,
                        product=item['product'],
                        product_name=item['product'].name,
                        quantity=item['quantity'],
                        unit_name=item['unit_name'],
                        unit_price=item['unit_price']
                    )

                # IMPORTANT: Notice we DO NOT call _fire_and_forget_post_order()
                # DO NOT send FCM, DO NOT send Admin alerts, DO NOT send Email, DO NOT deduct stock.

            messages.success(
                request,
                f"✅ Test Order #{order.order_number} created successfully with Lat/Lng ({delivery_latitude}, {delivery_longitude})! (No Email, FCM Push, or SMS notifications were sent)"
            )
            return redirect('admin:orders_testorder_change', order.pk)

        except Exception as e:
            messages.error(request, f"Failed to create test order: {str(e)}")
            return redirect('admin_create_test_order')
