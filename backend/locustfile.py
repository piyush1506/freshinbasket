from locust import HttpUser, task ,between

class FreshinbasketUser(HttpUser):
    wait_time = between(1,3)
    
    
    @task
    def get_products(self):
        self.client.get('/api/products/')
        
    # @task
    # def get_product(self):
    #     self.client.get('api/products')    