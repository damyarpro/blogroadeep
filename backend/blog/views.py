from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response

from .filters import PostFilter
from .models import Category, Post, Tag
from .serializers import (
    CategorySerializer,
    CommentCreateSerializer,
    PostDetailSerializer,
    PostListSerializer,
    TagSerializer,
)


def published_posts_q():
    """Q object counting only publicly visible posts on a related manager."""
    return Q(
        posts__status=Post.Status.PUBLISHED,
        posts__published_at__isnull=False,
        posts__published_at__lte=timezone.now(),
    )


class PostListView(generics.ListAPIView):
    serializer_class = PostListSerializer
    filterset_class = PostFilter
    search_fields = ["title", "excerpt", "content"]
    ordering_fields = ["published_at", "created_at", "title", "reading_time"]
    ordering = ["-published_at"]

    def get_queryset(self):
        return Post.published.with_related().distinct()


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Post.published.with_related().prefetch_related("comments")


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return Category.objects.annotate(
            post_count=Count("posts", filter=published_posts_q(), distinct=True)
        )


class TagListView(generics.ListAPIView):
    serializer_class = TagSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return Tag.objects.annotate(
            post_count=Count("posts", filter=published_posts_q(), distinct=True)
        )


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentCreateSerializer

    def create(self, request, *args, **kwargs):
        post = get_object_or_404(Post.published.all(), slug=self.kwargs["slug"])
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(post=post)
        return Response(
            {
                "detail": "دیدگاه شما ثبت شد و پس از تأیید منتشر می‌شود.",
                "comment": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


@require_GET
def robots_txt(request):
    sitemap_url = request.build_absolute_uri("/sitemap.xml")
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "",
        f"Sitemap: {sitemap_url}",
        "",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain; charset=utf-8")
