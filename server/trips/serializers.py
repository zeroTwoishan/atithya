from rest_framework import serializers

from .models import Trip, ItineraryItem, Booking


class ItineraryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryItem
        fields = ["id", "day_number", "sequence", "item_type", "listing", "known_site", "notes", "start_time", "end_time"]


class TripSerializer(serializers.ModelSerializer):
    itinerary_items = ItineraryItemSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = ["id", "tourist", "budget", "interests", "start_date", "end_date", "status", "created_at", "itinerary_items"]
        read_only_fields = ["id", "status", "created_at"]


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "trip", "listing", "quantity", "unit_price", "total_price", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]
