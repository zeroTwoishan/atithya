from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Trip
from .serializers import TripSerializer


class TripViewSet(viewsets.ModelViewSet):
    """docs/TRD.md §4 — `/api/v1/trips`, `/api/v1/trips/:id`.

    `create`/`partial_update` currently just persist the Trip row as-is — the
    actual Planning & Booking Agent (docs/TRD.md §3.2: retrieve_candidates ->
    compose_itinerary -> await_edit) is TODO for hackathon day, R1. Wire it in
    by generating ItineraryItem rows inside `perform_create`/`perform_update`.
    """

    queryset = Trip.objects.all().order_by("-created_at")
    serializer_class = TripSerializer
    filterset_fields = ["status", "tourist"]

    @action(detail=True, methods=["post"])
    def book(self, request, pk=None):
        """docs/TRD.md §4 `/api/v1/trips/:id/book`.

        TODO (hackathon day, R1+R5): create Booking + WalletTransaction rows,
        decrement listing availability (docs/TRD.md §3.2 node 4).
        """
        return Response({"error": {"code": "not_implemented", "message": "Booking flow not wired up yet"}}, status=501)

    @action(detail=True, methods=["post"])
    def replan(self, request, pk=None):
        """docs/TRD.md §4 `/api/v1/trips/:id/replan` — stretch, cut first per BUILD_PLAN §3."""
        return Response({"error": {"code": "not_implemented", "message": "Adaptive re-planning agent not built (stretch scope)"}}, status=501)
