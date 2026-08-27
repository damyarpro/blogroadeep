"""URL routes for the staff-only authoring API (mounted at /api/admin/)."""

from django.urls import include, path
from rest_framework.permissions import IsAdminUser
from rest_framework.routers import APIRootView, DefaultRouter

from . import admin_views


class AdminAPIRootView(APIRootView):
    """The router's index page is staff-only too — it must not leak the route map."""

    permission_classes = [IsAdminUser]


class AdminRouter(DefaultRouter):
    APIRootView = AdminAPIRootView


router = AdminRouter()
router.register("posts", admin_views.AdminPostViewSet, basename="admin-post")
router.register(
    "categories", admin_views.AdminCategoryViewSet, basename="admin-category"
)
router.register("tags", admin_views.AdminTagViewSet, basename="admin-tag")
router.register("comments", admin_views.AdminCommentViewSet, basename="admin-comment")

urlpatterns = [
    path("stats/", admin_views.AdminStatsView.as_view(), name="admin-stats"),
    path("uploads/", admin_views.AdminUploadView.as_view(), name="admin-upload"),
    path("", include(router.urls)),
]
