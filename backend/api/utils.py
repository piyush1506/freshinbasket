import os
import requests
import logging

logger = logging.getLogger('api')

def send_msg91_otp(phone_number, otp_code):
    auth_key = os.getenv('MSG91_AUTH_KEY')
    template_id = os.getenv('MSG91_TEMPLATE_ID')
    
    if not auth_key or not template_id:
        logger.warning(f"MSG91 credentials not set. Simulated OTP for {phone_number}: {otp_code}")
        print(f"\n=========================================")
        print(f" SIMULATED SMS OTP to {phone_number}")
        print(f" OTP CODE: {otp_code}")
        print(f"=========================================\n")
        return True

    # Sending custom OTP via MSG91 OTP API
    url = f"https://control.msg91.com/api/v5/otp?template_id={template_id}&mobile=91{phone_number}&authkey={auth_key}&otp={otp_code}"
    
    try:
        response = requests.post(url)
        data = response.json()
        if data.get("type") == "success":
            logger.info(f"OTP sent successfully to {phone_number} via MSG91")
            return True
        else:
            logger.error(f"Failed to send MSG91 OTP: {data}")
            return False
    except Exception as e:
        logger.error(f"Exception sending MSG91 OTP: {str(e)}")
        return False
