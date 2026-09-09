from rest_framework.routers import DefaultRouter

from .views import ListingViewSet, KnownSiteViewSet

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("known-sites", KnownSiteViewSet, basename="known-site")

urlpatterns = router.urls
