from django.apps import AppConfig


class OrdersConfig(AppConfig):
    name = 'orders'

    def ready(self):
        import sys

        # Don't start scheduler during migrations or management commands
        if len(sys.argv) > 1 and sys.argv[1] in (
            'migrate', 'makemigrations', 'collectstatic',
            'createsuperuser', 'shell', 'dbshell', 'test',
        ):
            return

        try:
            from orders.scheduler import start_scheduler
            start_scheduler()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Could not start scheduler: {e}")
