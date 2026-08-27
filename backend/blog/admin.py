from django.contrib import admin, messages
from django.db.models import Count

from .models import Category, Comment, Post, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "post_count"]
    search_fields = ["name", "slug", "description"]
    prepopulated_fields = {"slug": ("name",)}

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_post_count=Count("posts"))

    @admin.display(description="posts", ordering="_post_count")
    def post_count(self, obj):
        return obj._post_count


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "post_count"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_post_count=Count("posts"))

    @admin.display(description="posts", ordering="_post_count")
    def post_count(self, obj):
        return obj._post_count


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ["name", "email", "body", "is_approved", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "slug",
        "author",
        "category",
        "status",
        "published_at",
        "reading_time",
    ]
    list_filter = ["status", "category", "tags", "published_at", "author"]
    search_fields = ["title", "slug", "excerpt", "content", "meta_keywords"]
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ["category", "tags"]
    date_hierarchy = "published_at"
    readonly_fields = ["created_at", "updated_at", "reading_time"]
    list_select_related = ["author", "category"]
    inlines = [CommentInline]
    actions = ["publish_posts"]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "title",
                    "slug",
                    "author",
                    "category",
                    "tags",
                    "status",
                    "published_at",
                )
            },
        ),
        ("Content", {"fields": ("excerpt", "content", "cover_image")}),
        (
            "SEO",
            {
                "classes": ("collapse",),
                "fields": (
                    "meta_title",
                    "meta_description",
                    "meta_keywords",
                    "canonical_url",
                ),
            },
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": ("reading_time", "created_at", "updated_at"),
            },
        ),
    )

    @admin.action(description="Publish selected posts")
    def publish_posts(self, request, queryset):
        count = 0
        for post in queryset:
            if post.status != Post.Status.PUBLISHED:
                post.status = Post.Status.PUBLISHED
                post.save()
                count += 1
        self.message_user(request, f"{count} post(s) published.", messages.SUCCESS)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "post", "created_at", "is_approved"]
    list_filter = ["is_approved", "created_at"]
    search_fields = ["name", "email", "body"]
    list_select_related = ["post"]
    actions = ["approve_comments", "reject_comments"]

    @admin.action(description="Approve selected comments")
    def approve_comments(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} comment(s) approved.", messages.SUCCESS)

    @admin.action(description="Unapprove selected comments")
    def reject_comments(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} comment(s) unapproved.", messages.WARNING)
