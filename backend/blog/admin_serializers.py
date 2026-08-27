"""Serializers for the staff-only authoring API under /api/admin/.

Deliberately separate from `serializers.py`: the public serializers are read-only
and must keep serving exactly what they serve today.
"""

from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Category, Comment, Post, Tag


def unique_slug(model, base, exclude_pk=None):
    """Return `base` (or `base-2`, `base-3`, …) so it is unique for `model`."""
    base = base or "post"
    candidate = base
    counter = 2
    while True:
        queryset = model.objects.filter(slug=candidate)
        if exclude_pk is not None:
            queryset = queryset.exclude(pk=exclude_pk)
        if not queryset.exists():
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


class PanelUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class AdminCategorySerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(
        max_length=140,
        allow_unicode=True,
        required=False,
        allow_blank=True,
        validators=[
            UniqueValidator(
                queryset=Category.objects.all(),
                message="این نامک قبلاً استفاده شده است.",
            )
        ],
    )
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "post_count"]

    def validate(self, attrs):
        if not attrs.get("slug"):
            base = slugify(
                attrs.get("name") or getattr(self.instance, "name", ""),
                allow_unicode=True,
            )
            attrs["slug"] = unique_slug(
                Category, base, getattr(self.instance, "pk", None)
            )
        return attrs


class AdminTagSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(
        max_length=100,
        allow_unicode=True,
        required=False,
        allow_blank=True,
        validators=[
            UniqueValidator(
                queryset=Tag.objects.all(),
                message="این نامک قبلاً استفاده شده است.",
            )
        ],
    )
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "post_count"]

    def validate(self, attrs):
        if not attrs.get("slug"):
            base = slugify(
                attrs.get("name") or getattr(self.instance, "name", ""),
                allow_unicode=True,
            )
            attrs["slug"] = unique_slug(Tag, base, getattr(self.instance, "pk", None))
        return attrs


class TagListField(serializers.Field):
    """Symmetric `tags` field: reads objects, accepts a list of ids or slugs."""

    default_error_messages = {
        "not_a_list": "برچسب‌ها باید به صورت فهرست ارسال شوند.",
        "not_found": "برچسب «{value}» یافت نشد.",
    }

    def get_value(self, dictionary):
        # multipart/form-data sends repeated `tags` keys; QueryDict.get() would
        # silently keep only the last one.
        if hasattr(dictionary, "getlist"):
            if self.field_name not in dictionary:
                return serializers.empty
            return dictionary.getlist(self.field_name)
        return dictionary.get(self.field_name, serializers.empty)

    def to_representation(self, value):
        tags = value.all() if hasattr(value, "all") else value
        return [{"id": t.id, "name": t.name, "slug": t.slug} for t in tags]

    def to_internal_value(self, data):
        if isinstance(data, (str, bytes)) or not hasattr(data, "__iter__"):
            self.fail("not_a_list")
        tags = []
        for item in data:
            if item in ("", None):
                continue
            tag = None
            if isinstance(item, int) or (isinstance(item, str) and item.isdigit()):
                tag = Tag.objects.filter(pk=int(item)).first()
            if tag is None and isinstance(item, str):
                tag = Tag.objects.filter(slug=item).first()
            if tag is None:
                self.fail("not_found", value=item)
            tags.append(tag)
        return tags


class AdminPostListSerializer(serializers.ModelSerializer):
    author = PanelUserSerializer(read_only=True)
    category = AdminCategorySerializer(read_only=True)
    tags = TagListField(read_only=True)
    cover_image = serializers.ImageField(read_only=True)
    comment_count = serializers.SerializerMethodField()
    pending_comment_count = serializers.SerializerMethodField()
    is_published = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "author",
            "category",
            "tags",
            "cover_image",
            "status",
            "is_published",
            "reading_time",
            "published_at",
            "created_at",
            "updated_at",
            "comment_count",
            "pending_comment_count",
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_pending_comment_count(self, obj):
        return obj.comments.filter(is_approved=False).count()


class AdminPostSerializer(serializers.ModelSerializer):
    author = PanelUserSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    category_detail = AdminCategorySerializer(source="category", read_only=True)
    tags = TagListField(required=False)
    slug = serializers.SlugField(
        max_length=220,
        allow_unicode=True,
        required=False,
        allow_blank=True,
        validators=[
            UniqueValidator(
                queryset=Post.objects.all(),
                message="نوشته‌ای با این نامک از قبل وجود دارد.",
            )
        ],
    )
    published_at = serializers.DateTimeField(required=False, allow_null=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    remove_cover_image = serializers.BooleanField(required=False, write_only=True)
    is_published = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "author",
            "category",
            "category_detail",
            "tags",
            "cover_image",
            "remove_cover_image",
            "status",
            "is_published",
            "published_at",
            "reading_time",
            "created_at",
            "updated_at",
            "meta_title",
            "meta_description",
            "meta_keywords",
            "canonical_url",
        ]
        read_only_fields = ["id", "reading_time", "created_at", "updated_at"]

    def validate_title(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("عنوان نوشته الزامی است.")
        return value

    def validate(self, attrs):
        if not attrs.get("slug"):
            if self.instance is not None and self.instance.slug:
                attrs.pop("slug", None)
            else:
                base = slugify(attrs.get("title", ""), allow_unicode=True)
                attrs["slug"] = unique_slug(Post, base)
        return attrs

    def create(self, validated_data):
        validated_data.pop("remove_cover_image", None)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["author"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.pop("remove_cover_image", False):
            instance.cover_image.delete(save=False)
            instance.cover_image = None
        # Unpublishing clears the publication date so re-publishing re-stamps it.
        if validated_data.get("status") == Post.Status.DRAFT and (
            "published_at" not in validated_data
        ):
            validated_data["published_at"] = None
        return super().update(instance, validated_data)


class AdminCommentSerializer(serializers.ModelSerializer):
    post_title = serializers.CharField(source="post.title", read_only=True)
    post_slug = serializers.CharField(source="post.slug", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "post_title",
            "post_slug",
            "name",
            "email",
            "body",
            "created_at",
            "is_approved",
        ]
        read_only_fields = ["id", "post", "name", "email", "body", "created_at"]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
