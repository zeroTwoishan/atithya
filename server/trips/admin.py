from django.contrib import admin

from .models import Trip, ItineraryItem, Booking, WalletTransaction, Payout, Review, SafetyAdvisory

admin.site.register(Trip)
admin.site.register(ItineraryItem)
admin.site.register(Booking)
admin.site.register(WalletTransaction)
admin.site.register(Payout)
admin.site.register(Review)
admin.site.register(SafetyAdvisory)
