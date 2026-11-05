from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class CustomUserManager(UserManager):
    """Keep Django superusers aligned with the application's ADMIN role."""

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        # Django's createsuperuser command sets staff/superuser flags, but it
        # does not know about this project's separate role field.
        extra_fields["role"] = "ADMIN"
        return super().create_superuser(
            username=username,
            email=email,
            password=password,
            **extra_fields,
        )


class User(AbstractUser):

    USER = "USER"
    AGENT = "AGENT"
    ADMIN = "ADMIN"

    ROLE_CHOICES = (
        (USER, "User"),
        (AGENT, "Agent"),
        (ADMIN, "Admin"),
    )

    objects = CustomUserManager()

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
