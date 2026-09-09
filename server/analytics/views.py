"""docs/TRD.md §4 — read-mostly aggregate endpoints over listings/trips/bookings.

All four views below are intentionally left as stubs: docs/BUILD_PLAN.md
hours 8-14 has R5 write the actual aggregate SQL/ORM queries once the query
shape is confirmed with whoever owns the consuming dashboard screen — see
docs/UI_UX_DESIGN.md §4 for the exact numbers each screen needs.
"""

from rest_framework.views import APIView
from rest_framework.response import Response


class _NotImplementedView(APIView):
    message = "Not implemented — see docs/BUILD_PLAN.md hours 8-14 (R5)."

    def get(self, request, *args, **kwargs):
        return Response({"error": {"code": "not_implemented", "message": self.message}}, status=501)


class HostDashboardView(_NotImplementedView):
    """`/api/v1/hosts/:id/dashboard` — bookings/earnings/analytics for one host."""


class HostPricingSuggestionsView(_NotImplementedView):
    """`/api/v1/hosts/:id/pricing-suggestions` — AI pricing copilot (docs/PRD.md Host Dashboard)."""


class GovHeatmapView(_NotImplementedView):
    """`/api/v1/gov/heatmap` — rendered client-side as a stylized zone diagram, not a real map (docs/TRD.md §4)."""


class GovSchemeMetricsView(_NotImplementedView):
    """`/api/v1/gov/scheme-metrics` — rural income / homestay growth / arrival trends."""
