"""
notifications/views.py
API endpoint to register/update the user's FCM device token.
Called by the Flutter app after login.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import FCMToken


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
