import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """docs/BACKEND_SCHEMA.md §3 `users` table."""

    class Role(models.TextChoices):
        HOST = "host"
        TOURIST = "tourist"
        GOV = "gov"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=16, choices=Role.choices)
    phone = models.CharField(max_length=32, unique=True, null=True, blank=True)
    language = models.CharField(max_length=8, default="hi")

    def __str__(self):
        return f"{self.username} ({self.role})"
