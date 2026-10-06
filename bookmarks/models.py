from django.db import models
from django.conf import settings
from properties.models import Property


class Bookmark(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="bookmarks"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = (
            "user",
            "property"
        )

    def __str__(self):
        return f"{self.user.username} - {self.property.title}"
