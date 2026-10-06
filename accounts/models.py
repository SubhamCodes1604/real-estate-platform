from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    USER = "USER"
    AGENT = "AGENT"
    ADMIN = "ADMIN"

    ROLE_CHOICES = (
        (USER, "User"),
        (AGENT, "Agent"),
        (ADMIN, "Admin"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=USER
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.username
