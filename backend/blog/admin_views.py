"""Staff-only authoring API (token auth) powering the in-site admin panel."""

import os
import uuid

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.files.storage import default_storage
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import mixins, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .admin_serializers import (
    AdminCategorySerializer,
    AdminCommentSerializer,
    AdminPostListSerializer,
    AdminPostSerializer,
    AdminTagSerializer,
    LoginSerializer,
    PanelUserSerializer,
)
from .models import Category, Comment, Post, Tag

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
}


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------


class LoginView(APIView):
    """Exchange username/password for a DRF auth token."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active:
            return Response(
                {"detail": "نام کاربری یا رمز عبور نادرست است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.is_staff:
            return Response(
                {"detail": "این حساب کاربری اجازهٔ ورود به پنل مدیریت را ندارد."},
                status=status.HTTP_403_FORBIDDEN,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": PanelUserSerializer(user).data})


class LogoutView(APIView):
    """Drop the caller's token so it can no longer be used."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(PanelUserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# Authoring resources
# ---------------------------------------------------------------------------


class AdminPostViewSet(viewsets.ModelViewSet):
    """Full CRUD over every post, drafts included."""

    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_fields = ["status", "category"]
    search_fields = ["title", "slug", "excerpt", "content"]
    ordering_fields = ["created_at", "updated_at", "published_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Post.objects.with_related().prefetch_related("comments").distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return AdminPostListSerializer
        return AdminPostSerializer

    @action(detail=False, methods=["get"], url_path="slug-available")
    def slug_available(self, request):
        raw = (request.query_params.get("slug") or "").strip()
        slug = slugify(raw, allow_unicode=True)
        exclude = request.query_params.get("exclude")
        if not slug:
            return Response(
                {
                    "slug": slug,
                    "available": False,
                    "detail": "نامک معتبر نیست.",
                }
            )
        queryset = Post.objects.filter(slug=slug)
        if exclude and str(exclude).isdigit():
            queryset = queryset.exclude(pk=int(exclude))
        return Response({"slug": slug, "available": not queryset.exists()})


class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return Category.objects.annotate(post_count=Count("posts", distinct=True))


class AdminTagViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminTagSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return Tag.objects.annotate(post_count=Count("posts", distinct=True))


class AdminCommentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Moderation queue: list, approve/unapprove (single or bulk) and delete."""

    permission_classes = [IsAdminUser]
    serializer_class = AdminCommentSerializer
    filterset_fields = ["is_approved", "post"]
    search_fields = ["name", "email", "body"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Comment.objects.select_related("post").all()

    def _set_approved(self, comment, value):
        if comment.is_approved != value:
            comment.is_approved = value
            comment.save(update_fields=["is_approved"])
        return comment

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        comment = self._set_approved(self.get_object(), True)
        return Response(self.get_serializer(comment).data)

    @action(detail=True, methods=["post"])
    def unapprove(self, request, pk=None):
        comment = self._set_approved(self.get_object(), False)
        return Response(self.get_serializer(comment).data)

    @action(detail=False, methods=["post"], url_path="bulk-approve")
    def bulk_approve(self, request):
        ids = request.data.get("ids") or []
        approved = request.data.get("is_approved", True)
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "فهرست شناسه‌های دیدگاه‌ها الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        valid_ids = [int(i) for i in ids if str(i).isdigit()]
        updated = Comment.objects.filter(pk__in=valid_ids).update(
            is_approved=bool(approved)
        )
        return Response({"updated": updated, "is_approved": bool(approved)})


class AdminStatsView(APIView):
    """Counters and recent activity for the panel dashboard."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        published_q = Q(
            status=Post.Status.PUBLISHED,
            published_at__isnull=False,
            published_at__lte=now,
        )
        posts = Post.objects.all()
        recent = (
            Post.objects.with_related().order_by("-created_at")[:5]
        )
        return Response(
            {
                "posts": {
                    "total": posts.count(),
                    "published": posts.filter(published_q).count(),
                    "draft": posts.filter(status=Post.Status.DRAFT).count(),
                    "scheduled": posts.filter(
                        status=Post.Status.PUBLISHED, published_at__gt=now
                    ).count(),
                },
                "comments": {
                    "total": Comment.objects.count(),
                    "pending": Comment.objects.filter(is_approved=False).count(),
                    "approved": Comment.objects.filter(is_approved=True).count(),
                },
                "taxonomy": {
                    "categories": Category.objects.count(),
                    "tags": Tag.objects.count(),
                },
                "recent_posts": AdminPostListSerializer(
                    recent, many=True, context={"request": request}
                ).data,
            }
        )


class AdminUploadView(APIView):
    """Accept a single image and return its absolute media URL."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file") or request.FILES.get("image")
        if upload is None:
            return Response(
                {"detail": "فایلی ارسال نشده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_size = getattr(settings, "MAX_UPLOAD_SIZE", 5 * 1024 * 1024)
        if upload.size > max_size:
            limit_mb = round(max_size / (1024 * 1024), 1)
            return Response(
                {"detail": f"حجم فایل نباید بیشتر از {limit_mb} مگابایت باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = (upload.content_type or "").split(";")[0].strip().lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {"detail": "تنها آپلود فایل تصویری مجاز است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self._is_real_image(upload):
            return Response(
                {"detail": "فایل ارسالی یک تصویر معتبر نیست."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extension = os.path.splitext(upload.name or "")[1].lower()[:10] or ".img"
        name = timezone.now().strftime(
            f"uploads/%Y/%m/{uuid.uuid4().hex}{extension}"
        )
        saved_path = default_storage.save(name, upload)
        url = default_storage.url(saved_path)
        return Response(
            {
                "url": request.build_absolute_uri(url),
                "path": saved_path,
                "name": upload.name,
                "size": upload.size,
            },
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _is_real_image(upload):
        """Content-Type is caller-supplied; confirm the bytes really are an image."""
        try:
            from PIL import Image

            upload.seek(0)
            Image.open(upload).verify()
        except Exception:
            return False
        finally:
            upload.seek(0)
        return True
