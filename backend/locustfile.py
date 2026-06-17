from locust import HttpUser, task, between

class FreshinbasketUser(HttpUser):
    wait_time = between(1, 3)

    @task(5)
    def products(self):
        self.client.get("/api/products/")

    @task(2)
    def categories(self):
        self.client.get("/api/categories/")

    @task(1)
    def product_detail(self):
        self.client.get("/api/products/1/")