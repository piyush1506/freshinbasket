import os
import sys
import django
import time

# Setup django environment
sys.path.append(r'C:\Users\USER\Desktop\greenmart\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshinbasket_core.settings')
django.setup()

from django.conf import settings
import razorpay

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

import requests
import json

try:
    close_time = int(time.time()) + 1800 
    
    payment_link = client.payment_link.create({
        "amount": 100,
        "currency": "INR",
        "accept_partial": False,
        "description": "Payment for Order #12345",
        "customer": {
            "name": "Customer",
            "contact": "+919876543210"
        },
        "notify": {
            "sms": False,
            "email": False
        },
        "reminder_enable": False,
        "reference_id": "test_order_123"
    })
    
    print("SUCCESS")
    print(payment_link)
except Exception as e:
    print("ERROR")
    print(str(e))
