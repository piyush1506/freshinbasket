"""
notifications/views.py
API endpoint to register/update the user's FCM device token.
Called by the Flutter app after login.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import FCMToken, DeviceToken


class RegisterFCMTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'error': 'token is required'}, status=400)

        # Upsert: create if new, update timestamp if exists
        FCMToken.objects.update_or_create(
            token=token,
            defaults={'user': request.user},
        )
        return Response({'status': 'token registered'})


class RegisterDeviceView(APIView):
    """
    Register a device FCM token — NO authentication required.
    This allows ALL app installs (including guest users who haven't
    created an account) to receive push notifications from admin.

    POST /api/v1/notifications/register-device/
    Body: { "token": "fcm_token_here", "platform": "ios" }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'error': 'token is required'}, status=400)

        platform = request.data.get('platform', 'android').strip().lower()
        if platform not in ('ios', 'android'):
            platform = 'android'

        # Determine user: attach if authenticated, otherwise null (guest)
        user = request.user if request.user.is_authenticated else None

        # Upsert: create if new token, update user/platform if existing
        DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'platform': platform,
                'user': user,
                'is_active': True,
            },
        )
        return Response({'status': 'device registered'})

