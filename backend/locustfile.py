import random
from locust import HttpUser, task, between

class FreshinbasketUser(HttpUser):
    wait_time = between(2, 5)
    
    def on_start(self):
        # Fetch products once when user starts so we know valid IDs
        response = self.client.get("/api/products/")
        if response.status_code == 200:
            data = response.json()
            # If it's a paginated response, the list is in 'results'
            products = data.get('results', data) if isinstance(data, dict) else data
            self.product_ids = [p['id'] for p in products] if products else []
        else:
            self.product_ids = []

    @task(3)
    def home(self):
        self.client.get("/api/home/")

    @task(5)
    def products(self):
        self.client.get("/api/products/")

    @task(1)
    def categories(self):
        self.client.get("/api/categories/")

    @task(10)
    def product_detail(self):
        if self.product_ids:
            product_id = random.choice(self.product_ids)
            self.client.get(f"/api/products/{product_id}/")
        else:
            self.client.get("/api/products/")