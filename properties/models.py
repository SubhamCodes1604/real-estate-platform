from django.db import models
from django.conf import settings


class Property(models.Model):

    PROPERTY_TYPES = (
        ("FLAT", "Flat"),
        ("HOUSE", "House"),
        ("VILLA", "Villa"),
        ("PLOT", "Plot"),
    )

    title = models.CharField(max_length=255)

    description = models.TextField()

    image = models.ImageField(
        upload_to="properties/",
        null=True,
        blank=True
    )   

    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPES
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    bedrooms = models.IntegerField()

    bathrooms = models.IntegerField()

    area_sqft = models.FloatField()

    address = models.TextField()

    city = models.CharField(max_length=100)

    state = models.CharField(max_length=100)

    pincode = models.CharField(max_length=20)

    is_featured = models.BooleanField(
        default=False
    )

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    is_approved = models.BooleanField(
        default=False
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title

    