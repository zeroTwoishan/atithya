import uuid

from django.conf import settings
from django.db import models

from listings.models import Listing, KnownSite


class Trip(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `trips`."""

    class Status(models.TextChoices):
        PLANNING = "planning"
        CONFIRMED = "confirmed"
        COMPLETED = "completed"
        CANCELLED = "cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tourist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="trips")
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    interests = models.JSONField(default=list, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PLANNING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip {self.id} ({self.tourist})"


class ItineraryItem(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `itinerary_items`."""

    class ItemType(models.TextChoices):
        KNOWN_SITE = "known_site"
        LISTING = "listing"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="itinerary_items")
    day_number = models.IntegerField()
    sequence = models.IntegerField()
    item_type = models.CharField(max_length=16, choices=ItemType.choices)
    listing = models.ForeignKey(Listing, on_delete=models.SET_NULL, null=True, blank=True)
    known_site = models.ForeignKey(KnownSite, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["trip", "day_number", "sequence"])]


class Booking(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `bookings`."""

    class Status(models.TextChoices):
        CONFIRMED = "confirmed"
        COMPLETED = "completed"
        CANCELLED = "cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.PROTECT, related_name="bookings")
    listing = models.ForeignKey(Listing, on_delete=models.PROTECT, related_name="bookings")
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.CONFIRMED)
    created_at = models.DateTimeField(auto_now_add=True)


class WalletTransaction(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `wallet_transactions` — mock ledger, real shape."""

    class Type(models.TextChoices):
        DEBIT = "debit"
        REFUND = "refund"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tourist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="wallet_transactions")
    trip = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=16, choices=Type.choices)
    created_at = models.DateTimeField(auto_now_add=True)


class Payout(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `payouts` — mock host payouts, real ledger shape."""

    class Status(models.TextChoices):
        PENDING = "pending"
        PAID = "paid"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payouts")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `reviews` — feeds host verification score (PRD §5.1)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT, related_name="reviews")
    listing = models.ForeignKey(Listing, on_delete=models.PROTECT, related_name="reviews")
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["listing"])]


class SafetyAdvisory(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `safety_advisories` — seeded, matched to itinerary stop regions."""

    class Severity(models.TextChoices):
        INFO = "info"
        CAUTION = "caution"
        WARNING = "warning"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.CharField(max_length=255)
    category = models.CharField(max_length=64)
    message = models.TextField()
    severity = models.CharField(max_length=16, choices=Severity.choices, default=Severity.INFO)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["region"])]
        verbose_name_plural = "safety advisories"
