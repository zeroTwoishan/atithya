from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from verification.services import run_verification
from .models import Listing, KnownSite
from .serializers import ListingSerializer, KnownSiteSerializer


class IsHostOwnerOrReadOnly(permissions.BasePermission):
    """A host can only create/edit/verify their own listings. Reads (the
    public catalog) stay open to any authenticated role — tourists and gov
    both need to browse listings."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.host_id == request.user.id


class ListingViewSet(viewsets.ModelViewSet):
    """docs/TRD.md §4 — `/api/v1/listings`, `/api/v1/listings/:id`."""

    queryset = Listing.objects.all().order_by("-created_at")
    serializer_class = ListingSerializer
    filterset_fields = ["status", "region", "offering_type", "host"]
    permission_classes = [permissions.IsAuthenticated, IsHostOwnerOrReadOnly]

    def perform_create(self, serializer):
        # `host` is read-only on the serializer (see ListingSerializer) —
        # this is the only place it's actually set, always to the caller.
        serializer.save(host=self.request.user)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """docs/TRD.md §4 `/api/v1/listings/:id/verify` — manual re-trigger.

        Runs the price-outlier rule check for real. The LLM contradiction
        check (docs/TRD.md §3.3) is still TODO for hackathon day, R2 — a
        listing that passes the rule check goes LIVE without it for now.
        `get_object()` enforces IsHostOwnerOrReadOnly — only the owning host
        can re-trigger verification (POST isn't a safe method).
        """
        listing = run_verification(self.get_object())
        return Response(ListingSerializer(listing).data)


class KnownSiteViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only — known_sites are seeded, not host-editable (docs/BACKEND_SCHEMA.md §5)."""

    queryset = KnownSite.objects.all()
    serializer_class = KnownSiteSerializer
    filterset_fields = ["region", "category"]
