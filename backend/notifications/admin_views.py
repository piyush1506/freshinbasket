"""
notifications/admin_views.py
Custom Django Admin view for sending manual push notifications.
Accessible at: /admin/notifications/send/
"""
import logging
import cloudinary.uploader
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import FCMToken
from .fcm import send_push_to_user, send_push

logger = logging.getLogger(__name__)
User = get_user_model()


@method_decorator(staff_member_required, name='dispatch')
class SendNotificationView(View):
    template_name = 'notifications/send_notification.html'

    def get(self, request):
        from django.db.models import Q
        from .models import DeviceToken
        
        # Get users who have FCM tokens (can receive notifications)
        users_with_tokens = User.objects.filter(
            Q(fcm_tokens__isnull=False) | Q(device_tokens__isnull=False)
        ).distinct().order_by('phone_number')

        total_tokens = FCMToken.objects.count() + DeviceToken.objects.count()

        context = {
            **admin.site.each_context(request),
            'title': 'Send Push Notification',
            'users': users_with_tokens,
            'total_tokens': total_tokens,
            'opts': FCMToken._meta,  # For breadcrumb
        }
        return render(request, self.template_name, context)

    def post(self, request):
        title = request.POST.get('title', '').strip()
        body = request.POST.get('body', '').strip()
        target = request.POST.get('target', 'all')  # 'all' or user id
        channel = request.POST.get('channel', 'promotions')
        image_file = request.FILES.get('image')  # Optional image upload

        if not title or not body:
            messages.error(request, 'Title and message body are required.')
            return redirect('admin_send_notification')

        # Upload image to Cloudinary if provided
        image_url = None
        if image_file:
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if image_file.content_type not in allowed_types:
                messages.error(request, 'Invalid image type. Allowed: JPEG, PNG, WebP, GIF.')
                return redirect('admin_send_notification')

            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                messages.error(request, 'Image too large. Maximum 5MB allowed.')
                return redirect('admin_send_notification')

            try:
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder='freshinbasket/notifications',
                    resource_type='image',
                    allowed_formats=['jpg', 'png', 'webp', 'gif'],
                )
                image_url = upload_result['secure_url']
            except Exception as e:
                logger.error(f"Cloudinary upload failed for notification image: {e}")
                messages.error(request, f'Image upload failed: {e}')
                return redirect('admin_send_notification')

        sent_count = 0
        failed_count = 0

        if target == 'all':
            # 1. Send to all registered DeviceTokens (which includes guests)
            from .models import DeviceToken
            device_tokens = list(DeviceToken.objects.filter(is_active=True).values_list('token', flat=True))
            
            # 2. Also get any FCMTokens just in case (legacy)
            legacy_tokens = list(FCMToken.objects.values_list('token', flat=True))
            
            # Combine unique tokens
            all_tokens = list(set(device_tokens + legacy_tokens))
            
            if all_tokens:
                from .fcm import send_bulk_push
                s_count, f_count = send_bulk_push(
                    tokens=all_tokens,
                    title=title,
                    body=body,
                    data={'channel': channel, 'route': 'home'},
                    image_url=image_url,
                )
                sent_count += s_count
                failed_count += f_count
            
            if sent_count > 0:
                messages.success(
                    request,
                    f'✅ Notification sent to {sent_count} device(s).'
                    + (f' {failed_count} failed.' if failed_count else '')
                    + (' 📷 With image.' if image_url else '')
                )
            else:
                messages.warning(request, 'No registered devices found or sending failed.')

        else:
            # Send to a specific user
            try:
                user = User.objects.get(pk=target)
                count = send_push_to_user(
                    user=user,
                    title=title,
                    body=body,
                    data={'channel': channel, 'route': 'home'},
                    image_url=image_url,
                )
                if count > 0:
                    messages.success(request, f'✅ Notification sent to {user.phone_number}.')
                else:
                    messages.error(request, f'❌ No active FCM token found for {user.phone_number}.')
            except User.DoesNotExist:
                messages.error(request, 'User not found.')

        logger.info(
            f'Admin {request.user} sent notification: title="{title}", target={target}'
            f'{", with_image=True" if image_url else ""}'
        )
        return redirect('admin_send_notification')

