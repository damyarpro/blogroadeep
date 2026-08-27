from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Category, Comment, Post, Tag

User = get_user_model()


class BlogTestData(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.author = User.objects.create_user(username="nevisande", password="pass1234")
        cls.category = Category.objects.create(name="برنامه‌نویسی", slug="programming")
        cls.other_category = Category.objects.create(name="طراحی", slug="design")
        cls.tag_django = Tag.objects.create(name="جنگو", slug="django")
        cls.tag_react = Tag.objects.create(name="ری‌اکت", slug="react")

        cls.published = Post.objects.create(
            title="نوشته منتشرشده",
            slug="published-post",
            author=cls.author,
            category=cls.category,
            excerpt="خلاصه نوشته منتشرشده",
            content="متن کامل نوشته منتشرشده " * 30,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
            meta_title="عنوان سئو",
            meta_description="توضیح سئو",
            meta_keywords="جنگو, وبلاگ",
            canonical_url="https://example.com/posts/published-post/",
        )
        cls.published.tags.add(cls.tag_django)

        cls.second_published = Post.objects.create(
            title="نوشته دوم درباره ری‌اکت",
            slug="second-post",
            author=cls.author,
            category=cls.other_category,
            excerpt="خلاصه نوشته دوم",
            content="محتوای نوشته دوم",
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        cls.second_published.tags.add(cls.tag_react)

        cls.draft = Post.objects.create(
            title="پیش‌نویس",
            slug="draft-post",
            author=cls.author,
            excerpt="خلاصه پیش‌نویس",
            content="متن پیش‌نویس",
            status=Post.Status.DRAFT,
        )


class PostListAPITests(BlogTestData):
    def test_list_returns_only_published_posts(self):
        response = self.client.get(reverse("blog:post-list"))
        self.assertEqual(response.status_code, 200)
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertCountEqual(slugs, ["published-post", "second-post"])
        self.assertNotIn("draft-post", slugs)

    def test_list_is_paginated_with_page_size_nine(self):
        response = self.client.get(reverse("blog:post-list"))
        payload = response.json()
        self.assertIn("count", payload)
        self.assertIn("results", payload)
        self.assertEqual(payload["count"], 2)
        self.assertLessEqual(len(payload["results"]), 9)

    def test_list_serializer_excludes_full_content(self):
        response = self.client.get(reverse("blog:post-list"))
        item = response.json()["results"][0]
        self.assertNotIn("content", item)
        self.assertIn("excerpt", item)
        self.assertIn("reading_time", item)

    def test_filter_by_category_slug(self):
        response = self.client.get(reverse("blog:post-list"), {"category": "design"})
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertEqual(slugs, ["second-post"])

    def test_filter_by_tag_slug(self):
        response = self.client.get(reverse("blog:post-list"), {"tag": "django"})
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertEqual(slugs, ["published-post"])

    def test_search_matches_title(self):
        response = self.client.get(reverse("blog:post-list"), {"search": "ری‌اکت"})
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertEqual(slugs, ["second-post"])

    def test_ordering_by_title(self):
        response = self.client.get(reverse("blog:post-list"), {"ordering": "title"})
        titles = [item["title"] for item in response.json()["results"]]
        self.assertEqual(titles, sorted(titles))


class PostDetailAPITests(BlogTestData):
    def test_detail_returns_content_and_seo_fields(self):
        url = reverse("blog:post-detail", kwargs={"slug": "published-post"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("content", payload)
        self.assertEqual(payload["meta_title"], "عنوان سئو")
        self.assertEqual(payload["meta_description"], "توضیح سئو")
        self.assertEqual(payload["meta_keywords"], "جنگو, وبلاگ")
        self.assertEqual(
            payload["canonical_url"], "https://example.com/posts/published-post/"
        )
        self.assertEqual(payload["seo"]["title"], "عنوان سئو")

    def test_draft_detail_returns_404(self):
        url = reverse("blog:post-detail", kwargs={"slug": "draft-post"})
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_unknown_slug_returns_404(self):
        url = reverse("blog:post-detail", kwargs={"slug": "no-such-post"})
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_detail_lists_only_approved_comments(self):
        Comment.objects.create(
            post=self.published,
            name="تأییدشده",
            email="ok@example.com",
            body="دیدگاه تأییدشده",
            is_approved=True,
        )
        Comment.objects.create(
            post=self.published,
            name="در انتظار",
            email="wait@example.com",
            body="دیدگاه در انتظار",
            is_approved=False,
        )
        url = reverse("blog:post-detail", kwargs={"slug": "published-post"})
        comments = self.client.get(url).json()["comments"]
        self.assertEqual(len(comments), 1)
        self.assertEqual(comments[0]["name"], "تأییدشده")

    def test_reading_time_is_computed_on_save(self):
        self.assertGreaterEqual(self.published.reading_time, 1)


class TaxonomyAPITests(BlogTestData):
    def test_categories_include_published_post_counts(self):
        response = self.client.get(reverse("blog:category-list"))
        self.assertEqual(response.status_code, 200)
        counts = {item["slug"]: item["post_count"] for item in response.json()}
        self.assertEqual(counts["programming"], 1)
        self.assertEqual(counts["design"], 1)

    def test_tags_include_published_post_counts(self):
        response = self.client.get(reverse("blog:tag-list"))
        self.assertEqual(response.status_code, 200)
        counts = {item["slug"]: item["post_count"] for item in response.json()}
        self.assertEqual(counts["django"], 1)
        self.assertEqual(counts["react"], 1)

    def test_draft_post_is_not_counted(self):
        self.draft.category = self.category
        self.draft.save()
        response = self.client.get(reverse("blog:category-list"))
        counts = {item["slug"]: item["post_count"] for item in response.json()}
        self.assertEqual(counts["programming"], 1)


class CommentCreateAPITests(BlogTestData):
    def _url(self, slug="published-post"):
        return reverse("blog:comment-create", kwargs={"slug": slug})

    def test_comment_is_created_unapproved(self):
        payload = {
            "name": "کاربر",
            "email": "user@example.com",
            "body": "سلام، متن خوبی بود.",
        }
        response = self.client.post(self._url(), payload)
        self.assertEqual(response.status_code, 201)
        comment = Comment.objects.get(email="user@example.com")
        self.assertFalse(comment.is_approved)
        self.assertEqual(comment.post, self.published)

    def test_new_comment_not_visible_on_detail(self):
        self.client.post(
            self._url(),
            {"name": "کاربر", "email": "user@example.com", "body": "متن دیدگاه"},
        )
        url = reverse("blog:post-detail", kwargs={"slug": "published-post"})
        self.assertEqual(self.client.get(url).json()["comments"], [])

    def test_invalid_comment_returns_400(self):
        response = self.client.post(self._url(), {"name": "", "email": "not-an-email"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Comment.objects.count(), 0)

    def test_comment_on_draft_post_returns_404(self):
        response = self.client.post(
            self._url("draft-post"),
            {"name": "کاربر", "email": "user@example.com", "body": "متن"},
        )
        self.assertEqual(response.status_code, 404)


class SeoEndpointTests(BlogTestData):
    def test_sitemap_returns_200_and_lists_published_posts(self):
        response = self.client.get("/sitemap.xml")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn("/posts/published-post/", body)
        self.assertNotIn("/posts/draft-post/", body)
        self.assertIn("/category/programming/", body)

    def test_robots_txt_allows_all_and_points_to_sitemap(self):
        response = self.client.get("/robots.txt")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn("User-agent: *", body)
        self.assertIn("Allow: /", body)
        self.assertIn("/sitemap.xml", body)

    def test_feed_returns_200_with_published_posts(self):
        response = self.client.get("/feed/")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn("نوشته منتشرشده", body)
        self.assertNotIn("پیش‌نویس", body)


class SeedCommandTests(TestCase):
    def test_seed_command_creates_published_content(self):
        from django.core.management import call_command

        call_command("seed_blog", verbosity=0)
        self.assertGreaterEqual(Post.published.count(), 6)
        self.assertGreaterEqual(Category.objects.count(), 3)
        self.assertTrue(Post.objects.filter(status=Post.Status.DRAFT).exists())

        # Idempotent: running twice must not duplicate rows.
        post_count = Post.objects.count()
        call_command("seed_blog", verbosity=0)
        self.assertEqual(Post.objects.count(), post_count)
