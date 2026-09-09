from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from verification.services import run_verification
from .models import Listing, KnownSite
from .serializers import ListingSerializer, KnownSiteSerializer


class ListingViewSet(viewsets.ModelViewSet):
    """docs/TRD.md §4 — `/api/v1/listings`, `/api/v1/listings/:id`."""

    queryset = Listing.objects.all().order_by("-created_at")
    serializer_class = ListingSerializer
    filterset_fields = ["status", "region", "offering_type", "host"]

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """docs/TRD.md §4 `/api/v1/listings/:id/verify` — manual re-trigger.

        Runs the price-outlier rule check for real. The LLM contradiction
        check (docs/TRD.md §3.3) is still TODO for hackathon day, R2 — a
        listing that passes the rule check goes LIVE without it for now.
        """
        listing = run_verification(self.get_object())
        return Response(ListingSerializer(listing).data)


class KnownSiteViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only — known_sites are seeded, not host-editable (docs/BACKEND_SCHEMA.md §5)."""

    queryset = KnownSite.objects.all()
    serializer_class = KnownSiteSerializer
    filterset_fields = ["region", "category"]
