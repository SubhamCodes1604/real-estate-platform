from django.db import models
from django.conf import settings
from properties.models import Property


class Inquiry(models.Model):

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="inquiries"
    )

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="inquiries"

    )

    message = models.TextField()

    response = models.TextField(
        blank=True,
        default=""
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.buyer.username} -> {self.property.title}"


