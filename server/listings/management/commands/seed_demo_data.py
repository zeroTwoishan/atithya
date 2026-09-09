"""docs/BACKEND_SCHEMA.md §5 — demo seed data, as a management command (not
raw SQL) so it goes through real model validation.

This seeds a representative starter set, not the full 15-20/5-10/20-30 counts
BACKEND_SCHEMA.md §5 asks for — top up more rows with the same pattern before
demo day (BUILD_PLAN.md hours 2-8, R5).

Usage: manage.py seed_demo_data
"""

import datetime
import random

from django.core.management.base import BaseCommand

from accounts.models import User
from listings.models import KnownSite, Listing
from trips.models import Booking, Review, SafetyAdvisory, Trip

KNOWN_SITES = [
    ("Kasol", "Parvati Valley, HP", "town", "Backpacker hub on the Parvati river, gateway to the valley."),
    ("Jibhi", "Banjar Valley, HP", "village", "Quiet pine-forest village popular for waterfalls and slow travel."),
    ("Chhoie Waterfall", "Tirthan Valley, HP", "nature", "Short forest trek to a seasonal waterfall near Gushaini."),
    ("Jalori Pass", "Banjar Valley, HP", "mountain-pass", "3,120m pass connecting Kullu and Shimla districts."),
    ("Great Himalayan National Park (GHNP) buffer", "Tirthan Valley, HP", "eco-zone", "UNESCO-listed park buffer with guided nature walks."),
    ("Manikaran", "Parvati Valley, HP", "pilgrimage", "Hot springs and Sikh/Hindu pilgrimage site on the Parvati."),
    ("Bijli Mahadev", "Kullu, HP", "pilgrimage", "Hilltop temple with a panoramic view of the Kullu valley."),
    ("Malana", "Parvati Valley, HP", "village", "Isolated village with its own customary governance, permit-restricted trail."),
]

HOSTS = [
    ("meera_devi", "Meera Devi", "+919800000001"),
    ("roshan_thakur", "Roshan Thakur", "+919800000002"),
    ("kullu_handloom_guild", "Kullu Handloom Guild", "+919800000003"),
]

LISTINGS = [
    dict(
        host_username="meera_devi", offering_type=Listing.OfferingType.HOMESTAY,
        title="Meera Devi's Himalayan Homestay", region="Tirthan Valley, HP",
        description="Traditional kathkuni-style homestay with fire-cooked Pahadi meals and river-facing rooms.",
        price_amount=1850, price_unit=Listing.PriceUnit.NIGHT,
    ),
    dict(
        host_username="roshan_thakur", offering_type=Listing.OfferingType.GUIDE,
        title="Sunrise Fly-Fishing & River Walk along Tirthan", region="Tirthan Valley, HP",
        description="Wade into glacial pools with handcrafted bamboo rods, catch-and-release fly casting on the Tirthan.",
        price_amount=1400, price_unit=Listing.PriceUnit.PERSON,
    ),
    dict(
        host_username="kullu_handloom_guild", offering_type=Listing.OfferingType.ARTISAN_EXPERIENCE,
        title="Patti Weaving & Natural Walnut Dyeing with Meena Di", region="Kullu, HP",
        description="Sit by the handloom in a 100-year-old workshop, natural walnut wood dye and weave your own patti.",
        price_amount=950, price_unit=Listing.PriceUnit.EXPERIENCE,
    ),
]

ADVISORIES = [
    ("Tirthan & Jibhi Belt", "road", "Safe to travel. No active landslides or road blocks on NH-305.", SafetyAdvisory.Severity.INFO),
    ("Jalori Pass & Jibhi Ridge", "weather", "High-altitude cold advisory after sunset — carry warm layers.", SafetyAdvisory.Severity.CAUTION),
]


class Command(BaseCommand):
    help = "Seed a representative set of known sites, listings, bookings, reviews, and advisories."

    def handle(self, *args, **options):
        for name, region, category, description in KNOWN_SITES:
            KnownSite.objects.get_or_create(name=name, defaults=dict(region=region, category=category, description=description))
        self.stdout.write(self.style.SUCCESS(f"{len(KNOWN_SITES)} known sites ready"))

        host_users = {}
        for username, full_name, phone in HOSTS:
            first, _, last = full_name.partition(" ")
            user, _ = User.objects.get_or_create(
                username=username,
                defaults=dict(role=User.Role.HOST, phone=phone, language="hi", first_name=first, last_name=last),
            )
            host_users[username] = user
        self.stdout.write(self.style.SUCCESS(f"{len(HOSTS)} demo hosts ready"))

        listings = []
        for data in LISTINGS:
            host = host_users[data.pop("host_username")]
            listing, _ = Listing.objects.get_or_create(
                title=data["title"],
                defaults=dict(host=host, status=Listing.Status.LIVE, **data),
            )
            listings.append(listing)
        self.stdout.write(self.style.SUCCESS(f"{len(listings)} demo listings ready"))

        tourist, _ = User.objects.get_or_create(
            username="seed_tourist", defaults=dict(role=User.Role.TOURIST, language="en"),
        )
        today = datetime.date.today()
        for i, listing in enumerate(listings):
            trip, _ = Trip.objects.get_or_create(
                tourist=tourist, budget=15000, interests=["mountains", "homestays"],
                start_date=today - datetime.timedelta(days=30 * (i + 1)),
                end_date=today - datetime.timedelta(days=30 * (i + 1) - 4),
                status=Trip.Status.COMPLETED,
            )
            booking, _ = Booking.objects.get_or_create(
                trip=trip, listing=listing, defaults=dict(
                    unit_price=listing.price_amount, total_price=listing.price_amount,
                    status=Booking.Status.COMPLETED,
                ),
            )
            Review.objects.get_or_create(
                booking=booking, listing=listing,
                defaults=dict(rating=random.randint(4, 5), comment="Wonderful, authentic experience."),
            )
        self.stdout.write(self.style.SUCCESS(f"{len(listings)} historical bookings/reviews ready"))

        for region, category, message, severity in ADVISORIES:
            SafetyAdvisory.objects.get_or_create(region=region, message=message, defaults=dict(category=category, severity=severity))
        self.stdout.write(self.style.SUCCESS(f"{len(ADVISORIES)} safety advisories ready"))
