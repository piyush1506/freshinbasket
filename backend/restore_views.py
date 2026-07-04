import sys
import re

with open(r'c:\Users\USER\Desktop\greenmart\backend\api\views.py', 'r') as f:
    content = f.read()

start_idx = content.find('class SendOTPView(APIView):')
end_idx = content.find('class RetryOTPView(APIView):')

if start_idx == -1:
    print('Could not find SendOTPView')
    sys.exit(1)

if end_idx == -1:
    end_idx = len(content)

new_code = """class SendOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number or len(str(phone_number)) < 10:
            return Response({'error': 'Valid 10-digit phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure it has the country code (e.g., 91 for India)
        if not str(phone_number).startswith('91'):
             phone_number = '91' + str(phone_number)
             
        # Using MSG91 Widget API (captcha disabled)
        url = "https://api.msg91.com/api/v5/widget/sendOtp"
        
        headers = {
            "authkey": settings.MSG91_AUTH_KEY,
            "content-type": "application/json"
        }
        
        payload = {
            "widgetId": settings.MSG91_WIDGET_ID,
            "identifier": str(phone_number)
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()
            logger.info(f'MSG91 SendOTP Response: {data}')  # Debug log
            if data.get("type") == "success":
                # Return reqId - frontend must save this and send it back during verify
                return Response({'message': 'OTP sent successfully.', 'reqId': data.get('message')})
            return Response({'error': data.get('message', 'Failed to send OTP'), 'msg91_response': data}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp_code = request.data.get('otp_code')
        
        if not phone_number or not otp_code:
            return Response({'error': 'Phone number and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Allow bypass for testing if in DEBUG mode
        from django.conf import settings
        is_test_bypass = settings.DEBUG and str(otp_code) == '123456'
        
        original_phone = str(phone_number)
        msg91_phone = original_phone if original_phone.startswith('91') else f"91{original_phone}"
        db_phone = original_phone[2:] if original_phone.startswith('91') else original_phone
        
        is_otp_valid = False
        
        if is_test_bypass:
            is_otp_valid = True
        else:
            # Must use Widget verify API since OTP was sent via Widget API
            req_id = request.data.get('reqId')  # reqId returned from sendOtp
            if not req_id:
                return Response({'error': 'reqId is required. Send OTP first.'}, status=status.HTTP_400_BAD_REQUEST)
            
            url = "https://api.msg91.com/api/v5/widget/verifyOtp"
            headers = {
                "authkey": settings.MSG91_AUTH_KEY,
                "content-type": "application/json"
            }
            payload = {
                "widgetId": settings.MSG91_WIDGET_ID,
                "reqId": req_id,
                "otp": str(otp_code)
            }
            try:
                response = requests.post(url, headers=headers, json=payload)
                data = response.json()
                logger.info(f'MSG91 VerifyOTP Response: {data}')  # Debug log
                if data.get("type") == "success":
                    is_otp_valid = True
                else:
                    return Response({'error': data.get('message', 'Invalid OTP')}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        if is_otp_valid:
            # Find or create user
            user, created = User.objects.get_or_create(
                phone_number=db_phone,
                defaults={
                    'username': None,
                    'email': None,
                }
            )
            
            if created:
                user.set_unusable_password()
                user.save()
                logger.info(f'New user registered via OTP: {db_phone}')
            else:
                logger.info(f'User logged in via OTP: {db_phone}')
                
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            from users.serializers import UserSerializer
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

"""

new_content = content[:start_idx] + new_code + content[end_idx:]

with open(r'c:\Users\USER\Desktop\greenmart\backend\api\views.py', 'w') as f:
    f.write(new_content)

print('Success')
