import uuid

from django.conf import settings
from django.db import models
from pgvector.django import VectorField


class KnownSite(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `known_sites` — curated well-known destinations."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    region = models.CharField(max_length=255)
    category = models.CharField(max_length=64)
    description = models.TextField(blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    def __str__(self):
        return self.name


class Listing(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `listings` — homestays/guides/artisans onboarded via WhatsApp."""

    class OfferingType(models.TextChoices):
        HOMESTAY = "homestay"
        GUIDE = "guide"
        ARTISAN_EXPERIENCE = "artisan_experience"
        OTHER = "other"

    class PriceUnit(models.TextChoices):
        NIGHT = "night"
        PERSON = "person"
        EXPERIENCE = "experience"

    class Status(models.TextChoices):
        PENDING_VERIFICATION = "pending_verification"
        NEEDS_REVIEW = "needs_review"
        LIVE = "live"
        INACTIVE = "inactive"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="listings")
    offering_type = models.CharField(max_length=32, choices=OfferingType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price_amount = models.DecimalField(max_digits=10, decimal_places=2)
    price_unit = models.CharField(max_length=16, choices=PriceUnit.choices)
    region = models.CharField(max_length=255)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    availability = models.JSONField(default=dict, blank=True)
    photo_urls = models.JSONField(default=list, blank=True)
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING_VERIFICATION)
    verification_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["status", "region"])]

    def __str__(self):
        return self.title
