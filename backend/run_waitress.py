import os
from waitress import serve
from freshinbasket_core.wsgi import application

if __name__ == '__main__':
    # Add project directory to python path
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshinbasket_core.settings')
    
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Waitress server on 0.0.0.0:{port} with 4 threads...")
    
    # Run the server with 16 threads for high concurrency load testing
    serve(application, host='0.0.0.0', port=port, threads=16)
