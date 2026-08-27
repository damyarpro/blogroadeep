from rest_framework import serializers

from .models import Category, Comment, Post, Tag


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "post_count"]


class TagSerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "post_count"]


class AuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "name", "body", "created_at"]


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "name", "email", "body", "created_at", "is_approved"]
        read_only_fields = ["id", "created_at", "is_approved"]

    def create(self, validated_data):
        # Every new comment waits for moderation.
        validated_data["is_approved"] = False
        return super().create(validated_data)


class PostListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    cover_image = serializers.SerializerMethodField()

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
            "reading_time",
            "published_at",
        ]

    def get_cover_image(self, obj):
        if not obj.cover_image:
            return None
        request = self.context.get("request")
        url = obj.cover_image.url
        return request.build_absolute_uri(url) if request else url


class PostDetailSerializer(PostListSerializer):
    comments = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            "content",
            "created_at",
            "updated_at",
            "meta_title",
            "meta_description",
            "meta_keywords",
            "canonical_url",
            "seo",
            "comments",
        ]

    def get_comments(self, obj):
        approved = obj.comments.filter(is_approved=True)
        return CommentSerializer(approved, many=True, context=self.context).data

    def get_seo(self, obj):
        return {
            "title": obj.seo_title,
            "description": obj.seo_description,
            "keywords": obj.meta_keywords,
            "canonical_url": obj.canonical_url,
        }
