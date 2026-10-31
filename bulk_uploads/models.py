from django.conf import settings
from django.db import models

from properties.models import Property


class PropertyImage(models.Model):
    """Gallery images for a property, supporting the bulk upload feature."""

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="gallery_images",
    )
    image = models.ImageField(
        upload_to="properties/gallery/",
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )
    order = models.IntegerField(
        default=0,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.property.title} - Image {self.id}"


class BulkUpload(models.Model):
    """Record of a bulk property import session."""

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bulk_uploads",
    )
    total_rows = models.IntegerField(default=0)
    imported_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        default="PENDING",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"BulkUpload {self.id} by {self.agent.username}"
        )
