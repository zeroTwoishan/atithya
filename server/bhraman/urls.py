"""Project URL configuration — see docs/TRD.md §4 for the full API surface this mirrors."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def health(request):
    return JsonResponse({"data": {"status": "ok"}})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health", health),
    path("api/v1/", include("listings.urls")),
    path("api/v1/", include("trips.urls")),
    path("api/v1/", include("analytics.urls")),
    path("webhooks/", include("onboarding.urls")),
]
