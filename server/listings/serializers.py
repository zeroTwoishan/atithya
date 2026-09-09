from rest_framework import serializers

from .models import Listing, KnownSite


class ListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = [
            "id", "host", "offering_type", "title", "description",
            "price_amount", "price_unit", "region", "lat", "lng",
            "availability", "photo_urls", "status", "verification_notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "verification_notes", "created_at", "updated_at"]


class KnownSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnownSite
        fields = ["id", "name", "region", "category", "description", "lat", "lng"]
