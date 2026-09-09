from django.contrib import admin

from .models import Listing, KnownSite


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("title", "host", "offering_type", "status", "region", "price_amount")
    list_filter = ("status", "offering_type", "region")
    search_fields = ("title", "description")


@admin.register(KnownSite)
class KnownSiteAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "category")
    list_filter = ("region", "category")
