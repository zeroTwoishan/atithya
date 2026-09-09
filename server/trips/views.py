from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Trip
from .serializers import TripSerializer


class IsOwningTourist(permissions.BasePermission):
    """A trip is private to the tourist who created it — no host/gov/other-
    tourist access via this endpoint. (Host/gov dashboards get their own
    aggregate views — see analytics app — rather than raw trip access.)"""

    def has_object_permission(self, request, view, obj):
        return obj.tourist_id == request.user.id


class TripViewSet(viewsets.ModelViewSet):
    """docs/TRD.md §4 — `/api/v1/trips`, `/api/v1/trips/:id`.

    `create`/`partial_update` currently just persist the Trip row as-is — the
    actual Planning & Booking Agent (docs/TRD.md §3.2: retrieve_candidates ->
    compose_itinerary -> await_edit) is TODO for hackathon day, R1. Wire it in
    by generating ItineraryItem rows inside `perform_create`/`perform_update`.
    """

    serializer_class = TripSerializer
    filterset_fields = ["status"]
    permission_classes = [permissions.IsAuthenticated, IsOwningTourist]

    def get_queryset(self):
        # Scoped to the caller's own trips — no role gets to browse everyone
        # else's budget/dates/itinerary through this endpoint.
        return Trip.objects.filter(tourist=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        # `tourist` is read-only on the serializer — always the caller.
        serializer.save(tourist=self.request.user)

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
