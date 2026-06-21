"""
Management command to clean up expired JWT tokens from the blacklist table.
Run this daily via cron to prevent the table from growing indefinitely:

  0 3 * * * /path/to/venv/bin/python /path/to/manage.py cleartokens >> /path/to/logs/cron.log 2>&1
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class Command(BaseCommand):
    help = 'Delete expired JWT outstanding and blacklisted tokens to keep the table lean'

    def handle(self, *args, **kwargs):
        now = timezone.now()

        # Delete blacklisted tokens whose outstanding token has expired
        expired_blacklisted = BlacklistedToken.objects.filter(
            token__expires_at__lt=now
        )
        count_bl = expired_blacklisted.count()
        expired_blacklisted.delete()

        # Delete expired outstanding tokens that were never blacklisted
        expired_outstanding = OutstandingToken.objects.filter(
            expires_at__lt=now,
            blacklistedtoken__isnull=True
        )
        count_ot = expired_outstanding.count()
        expired_outstanding.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Cleaned up {count_bl} expired blacklisted tokens '
                f'and {count_ot} expired outstanding tokens.'
            )
        )
