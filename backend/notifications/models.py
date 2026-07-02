"""
notifications/models.py
Stores FCM device tokens per user.
Each user can have multiple tokens (different devices / reinstalls).
"""
from django.db import models
from django.conf import settings


class FCMToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fcm_tokens',
    )
    token = models.TextField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'FCM Token'
        verbose_name_plural = 'FCM Tokens'

    def __str__(self):
        return f"{self.user} — {self.token[:20]}..."
