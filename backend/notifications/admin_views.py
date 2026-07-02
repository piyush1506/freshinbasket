"""
notifications/admin_views.py
Custom Django Admin view for sending manual push notifications.
Accessible at: /admin/notifications/send/
"""
import logging
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
        # Get users who have FCM tokens (can receive notifications)
        users_with_tokens = User.objects.filter(
            fcm_tokens__isnull=False
        ).distinct().order_by('phone_number')

        total_tokens = FCMToken.objects.count()

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

        if not title or not body:
            messages.error(request, 'Title and message body are required.')
            return redirect('admin_send_notification')

        sent_count = 0
        failed_count = 0

        if target == 'all':
            # Broadcast to all users with FCM tokens
            users = User.objects.filter(fcm_tokens__isnull=False).distinct()
            for user in users:
                count = send_push_to_user(
                    user=user,
                    title=title,
                    body=body,
                    data={'channel': channel, 'route': 'home'},
                )
                if count > 0:
                    sent_count += 1
                else:
                    failed_count += 1

            if sent_count > 0:
                messages.success(
                    request,
                    f'✅ Notification sent to {sent_count} user(s).'
                    + (f' {failed_count} skipped (no token).' if failed_count else '')
                )
            else:
                messages.warning(request, 'No users with registered devices found.')

        else:
            # Send to a specific user
            try:
                user = User.objects.get(pk=target)
                count = send_push_to_user(
                    user=user,
                    title=title,
                    body=body,
                    data={'channel': channel, 'route': 'home'},
                )
                if count > 0:
                    messages.success(request, f'✅ Notification sent to {user.phone_number}.')
                else:
                    messages.error(request, f'❌ No active FCM token found for {user.phone_number}.')
            except User.DoesNotExist:
                messages.error(request, 'User not found.')

        logger.info(
            f'Admin {request.user} sent notification: title="{title}", target={target}'
        )
        return redirect('admin_send_notification')
