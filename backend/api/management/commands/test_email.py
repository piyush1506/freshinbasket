from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from store.models import StoreSettings
import os


class Command(BaseCommand):
    help = "Test sending an email alert using current SMTP settings"

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            dest='recipient',
            help='Recipient email address (defaults to StoreSettings or ADMIN_EMAIL)',
            default=None
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Testing Email Configuration..."))
        self.stdout.write(f"EMAIL_BACKEND:   {settings.EMAIL_BACKEND}")
        self.stdout.write(f"EMAIL_HOST:      {settings.EMAIL_HOST}")
        self.stdout.write(f"EMAIL_PORT:      {settings.EMAIL_PORT}")
        self.stdout.write(f"EMAIL_USE_TLS:   {getattr(settings, 'EMAIL_USE_TLS', False)}")
        self.stdout.write(f"EMAIL_USE_SSL:   {getattr(settings, 'EMAIL_USE_SSL', False)}")
        self.stdout.write(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(NOT SET!)'}")
        has_pwd = bool(settings.EMAIL_HOST_PASSWORD)
        self.stdout.write(f"EMAIL_PASSWORD:  {'[SET - ' + str(len(settings.EMAIL_HOST_PASSWORD)) + ' chars]' if has_pwd else '(NOT SET!)'}")
        self.stdout.write(f"FROM_EMAIL:      {settings.DEFAULT_FROM_EMAIL or '(NOT SET!)'}")

        recipient = options.get('recipient')
        if not recipient:
            try:
                ss = StoreSettings.get_settings()
                if ss and ss.admin_notification_email:
                    recipient = ss.admin_notification_email.split(',')[0].strip()
            except Exception:
                pass

        if not recipient:
            recipient = os.getenv('ADMIN_EMAIL', '').split(',')[0].strip() if os.getenv('ADMIN_EMAIL') else None

        if not recipient:
            recipient = settings.EMAIL_HOST_USER

        if not recipient:
            self.stdout.write(self.style.ERROR("Error: No recipient email found. Provide one using --to your@email.com"))
            return

        self.stdout.write(f"Sending test email to: {recipient}...")

        try:
            send_mail(
                subject="🧪 Freshinbasket Test Email Alert",
                message="This is a test email to verify that order alerts work properly.",
                from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
                recipient_list=[recipient],
                fail_silently=False
            )
            self.stdout.write(self.style.SUCCESS(f"✅ SUCCESS! Test email successfully sent to {recipient}."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ FAILED to send email: {e}"))
            self.stdout.write(self.style.WARNING(
                "\nTroubleshooting tips:\n"
                "1. If 'Connection unexpectedly closed':\n"
                "   - Many cloud VPS providers block outgoing port 587. Try switching to port 465 SSL:\n"
                "     In .env set: EMAIL_PORT=465\n"
                "2. If 'Username and Password not accepted' (535):\n"
                "   - For Gmail, you must use a 16-character 'App Password', NOT your regular account password.\n"
                "   - Generate it at: https://myaccount.google.com/apppasswords\n"
            ))
