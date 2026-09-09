from django.urls import path

from .views import HostDashboardView, HostPricingSuggestionsView, GovHeatmapView, GovSchemeMetricsView

urlpatterns = [
    path("hosts/<uuid:pk>/dashboard", HostDashboardView.as_view()),
    path("hosts/<uuid:pk>/pricing-suggestions", HostPricingSuggestionsView.as_view()),
    path("gov/heatmap", GovHeatmapView.as_view()),
    path("gov/scheme-metrics", GovSchemeMetricsView.as_view()),
]
