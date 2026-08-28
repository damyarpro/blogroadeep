import io
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
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


# ---------------------------------------------------------------------------
# Authoring panel: token auth + staff-only /api/admin/ API
# ---------------------------------------------------------------------------


class PanelTestData(BlogTestData):
    """Adds a staff author and a plain reader on top of the public fixtures."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.staff = User.objects.create_user(
            username="modir",
            password="modir1234",
            is_staff=True,
            first_name="مدیر",
            last_name="سایت",
        )
        cls.reader = User.objects.create_user(username="khanande", password="pass1234")

    def login(self, username="modir", password="modir1234"):
        response = self.client.post(
            reverse("blog:auth-login"),
            {"username": username, "password": password},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()["token"]

    def auth(self, token):
        return {"HTTP_AUTHORIZATION": f"Token {token}"}


class AuthAPITests(PanelTestData):
    def test_login_returns_token_and_user(self):
        response = self.client.post(
            reverse("blog:auth-login"),
            {"username": "modir", "password": "modir1234"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["token"])
        self.assertEqual(payload["user"]["username"], "modir")
        self.assertTrue(payload["user"]["is_staff"])
        self.assertEqual(payload["user"]["full_name"], "مدیر سایت")

    def test_login_with_wrong_password_returns_400(self):
        response = self.client.post(
            reverse("blog:auth-login"),
            {"username": "modir", "password": "nope"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_login_rejects_non_staff_user(self):
        response = self.client.post(
            reverse("blog:auth-login"),
            {"username": "khanande", "password": "pass1234"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_me_returns_current_user_and_logout_invalidates_token(self):
        token = self.login()
        me = self.client.get(reverse("blog:auth-me"), **self.auth(token))
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "modir")

        logout = self.client.post(reverse("blog:auth-logout"), **self.auth(token))
        self.assertEqual(logout.status_code, 204)

        after = self.client.get(reverse("blog:auth-me"), **self.auth(token))
        self.assertEqual(after.status_code, 401)


class AdminApiPermissionTests(PanelTestData):
    def endpoints(self):
        return [
            reverse("blog:admin-post-list"),
            reverse("blog:admin-category-list"),
            reverse("blog:admin-tag-list"),
            reverse("blog:admin-comment-list"),
            reverse("blog:admin-stats"),
            reverse("blog:admin-upload"),
        ]

    def test_anonymous_is_rejected_from_every_admin_endpoint(self):
        for url in self.endpoints():
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 401)

    def test_non_staff_token_is_rejected_from_every_admin_endpoint(self):
        from rest_framework.authtoken.models import Token

        token = Token.objects.create(user=self.reader).key
        for url in self.endpoints():
            with self.subTest(url=url):
                response = self.client.get(url, **self.auth(token))
                self.assertEqual(response.status_code, 403)

    def test_non_staff_cannot_create_a_post(self):
        from rest_framework.authtoken.models import Token

        token = Token.objects.create(user=self.reader).key
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {"title": "نوشته غیرمجاز", "content": "<p>متن</p>"},
            content_type="application/json",
            **self.auth(token),
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Post.objects.filter(title="نوشته غیرمجاز").exists())

    def test_api_root_index_is_staff_only(self):
        self.assertEqual(self.client.get("/api/admin/").status_code, 401)
        token = self.login()
        self.assertEqual(
            self.client.get("/api/admin/", **self.auth(token)).status_code, 200
        )

    def test_public_api_stays_anonymous(self):
        self.assertEqual(self.client.get(reverse("blog:post-list")).status_code, 200)


class AdminPostApiTests(PanelTestData):
    def setUp(self):
        self.token = self.login()

    def test_list_includes_drafts_and_supports_status_filter(self):
        response = self.client.get(reverse("blog:admin-post-list"), **self.auth(self.token))
        self.assertEqual(response.status_code, 200)
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertIn("draft-post", slugs)
        self.assertIn("published-post", slugs)

        drafts = self.client.get(
            reverse("blog:admin-post-list"), {"status": "draft"}, **self.auth(self.token)
        )
        self.assertEqual(
            [item["slug"] for item in drafts.json()["results"]], ["draft-post"]
        )

    def test_search_filter(self):
        response = self.client.get(
            reverse("blog:admin-post-list"),
            {"search": "ری‌اکت"},
            **self.auth(self.token),
        )
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertEqual(slugs, ["second-post"])

    def test_staff_can_create_a_draft_that_stays_off_the_public_api(self):
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {
                "title": "نوشتهٔ تازه از پنل",
                "excerpt": "خلاصهٔ نوشتهٔ تازه",
                "content": "<p>متن نوشتهٔ تازه</p>",
                "category": self.category.id,
                "tags": [self.tag_django.id, "react"],
                "status": "draft",
                "meta_title": "عنوان سئوی تازه",
                "meta_description": "توضیح سئوی تازه",
                "meta_keywords": "پنل, سئو",
                "canonical_url": "https://example.com/posts/new/",
            },
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 201, response.content)
        payload = response.json()
        self.assertEqual(payload["author"]["username"], "modir")
        self.assertEqual(payload["meta_title"], "عنوان سئوی تازه")
        self.assertCountEqual(
            [tag["slug"] for tag in payload["tags"]], ["django", "react"]
        )

        post = Post.objects.get(pk=payload["id"])
        self.assertEqual(post.status, Post.Status.DRAFT)

        detail = self.client.get(
            reverse("blog:post-detail", kwargs={"slug": post.slug})
        )
        self.assertEqual(detail.status_code, 404)

    def test_publishing_makes_the_post_visible_on_the_public_api(self):
        created = self.client.post(
            reverse("blog:admin-post-list"),
            {"title": "نوشتهٔ منتشرشدنی", "content": "<p>متن</p>", "status": "draft"},
            content_type="application/json",
            **self.auth(self.token),
        ).json()

        response = self.client.patch(
            reverse("blog:admin-post-detail", kwargs={"pk": created["id"]}),
            {"status": "published"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json()["is_published"])

        slug = response.json()["slug"]
        public = self.client.get(reverse("blog:post-detail", kwargs={"slug": slug}))
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.json()["title"], "نوشتهٔ منتشرشدنی")

    def test_unpublishing_hides_the_post_again(self):
        response = self.client.patch(
            reverse("blog:admin-post-detail", kwargs={"pk": self.published.id}),
            {"status": "draft"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 200)
        public = self.client.get(
            reverse("blog:post-detail", kwargs={"slug": "published-post"})
        )
        self.assertEqual(public.status_code, 404)

    def test_staff_can_update_and_delete_a_post(self):
        url = reverse("blog:admin-post-detail", kwargs={"pk": self.draft.id})
        updated = self.client.patch(
            url,
            {"title": "پیش‌نویس ویرایش‌شده", "excerpt": "خلاصهٔ تازه"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(updated.status_code, 200)
        self.draft.refresh_from_db()
        self.assertEqual(self.draft.title, "پیش‌نویس ویرایش‌شده")

        deleted = self.client.delete(url, **self.auth(self.token))
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Post.objects.filter(pk=self.draft.id).exists())

    def test_slug_is_generated_from_title_when_omitted(self):
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {"title": "نامک خودکار فارسی", "content": "<p>متن</p>"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["slug"], "نامک-خودکار-فارسی")

    def test_duplicate_slug_is_rejected(self):
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {"title": "تکراری", "slug": "published-post", "content": "<p>م</p>"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("slug", response.json())

    def test_slug_availability_endpoint(self):
        url = reverse("blog:admin-post-slug-available")

        taken = self.client.get(url, {"slug": "published-post"}, **self.auth(self.token))
        self.assertEqual(taken.status_code, 200)
        self.assertFalse(taken.json()["available"])

        free = self.client.get(url, {"slug": "a-brand-new-slug"}, **self.auth(self.token))
        self.assertTrue(free.json()["available"])

        # Excluding the post that owns the slug frees it up again.
        excluded = self.client.get(
            url,
            {"slug": "published-post", "exclude": self.published.id},
            **self.auth(self.token),
        )
        self.assertTrue(excluded.json()["available"])

    def test_slug_availability_requires_staff(self):
        response = self.client.get(
            reverse("blog:admin-post-slug-available"), {"slug": "x"}
        )
        self.assertEqual(response.status_code, 401)


class ContentSanitizationTests(PanelTestData):
    def setUp(self):
        self.token = self.login()

    def test_text_align_style_survives_on_paragraphs(self):
        from .sanitize import sanitize_html

        self.assertEqual(
            sanitize_html('<p style="text-align: center">x</p>'),
            '<p style="text-align: center">x</p>',
        )
        # Any other property, alone or combined, drops the whole attribute.
        self.assertEqual(sanitize_html('<p style="position:fixed">x</p>'), "<p>x</p>")
        self.assertEqual(
            sanitize_html('<p style="text-align:center;position:fixed">x</p>'),
            "<p>x</p>",
        )

    def test_highlight_color_survives_on_mark_only(self):
        from .sanitize import sanitize_html

        self.assertEqual(
            sanitize_html('<mark style="background-color: #fde68a">x</mark>'),
            '<mark style="background-color: #fde68a">x</mark>',
        )
        self.assertEqual(
            sanitize_html('<mark style="background-color: url(javascript:1)">x</mark>'),
            "<mark>x</mark>",
        )
        # style is not whitelisted on span at all.
        self.assertEqual(
            sanitize_html('<span style="background-color:#fde68a">x</span>'),
            "<span>x</span>",
        )

    def test_script_is_stripped_from_submitted_content(self):
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {
                "title": "نوشتهٔ ناامن",
                "content": (
                    "<p>سالم</p><script>alert('xss')</script>"
                    "<img src=\"x\" onerror=\"alert(1)\" alt=\"تصویر\">"
                    "<p style=\"color:red\">استایل</p>"
                ),
            },
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 201, response.content)
        content = response.json()["content"]
        self.assertNotIn("<script", content)
        self.assertNotIn("alert(", content)
        self.assertNotIn("onerror", content)
        self.assertNotIn("style=", content)
        self.assertIn("<p>سالم</p>", content)
        self.assertIn('alt="تصویر"', content)

        stored = Post.objects.get(pk=response.json()["id"])
        self.assertNotIn("<script", stored.content)

    def test_allowed_markup_survives_sanitization(self):
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {
                "title": "نوشتهٔ سالم",
                "content": (
                    "<h2>سرتیتر</h2><ul><li>مورد</li></ul>"
                    "<blockquote>نقل قول</blockquote>"
                    '<a href="https://example.com">پیوند</a>'
                ),
            },
            content_type="application/json",
            **self.auth(self.token),
        )
        content = response.json()["content"]
        for fragment in ["<h2>", "<ul>", "<li>", "<blockquote>", "<a href="]:
            self.assertIn(fragment, content)


class AdminCommentApiTests(PanelTestData):
    def setUp(self):
        self.token = self.login()
        self.pending = Comment.objects.create(
            post=self.published,
            name="در انتظار",
            email="pending@example.com",
            body="این دیدگاه هنوز تأیید نشده است.",
            is_approved=False,
        )

    def test_list_filters_by_approval_state(self):
        response = self.client.get(
            reverse("blog:admin-comment-list"),
            {"is_approved": "false"},
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.json()["results"]]
        self.assertIn(self.pending.id, ids)

    def test_approve_action_publishes_the_comment_on_the_public_detail(self):
        detail_url = reverse("blog:post-detail", kwargs={"slug": "published-post"})
        before = self.client.get(detail_url).json()["comments"]
        self.assertNotIn("در انتظار", [c["name"] for c in before])

        response = self.client.post(
            reverse("blog:admin-comment-approve", kwargs={"pk": self.pending.id}),
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_approved"])
        self.pending.refresh_from_db()
        self.assertTrue(self.pending.is_approved)

        after = self.client.get(detail_url).json()["comments"]
        self.assertIn("در انتظار", [c["name"] for c in after])

    def test_unapprove_action_hides_the_comment_again(self):
        self.pending.is_approved = True
        self.pending.save(update_fields=["is_approved"])
        response = self.client.post(
            reverse("blog:admin-comment-unapprove", kwargs={"pk": self.pending.id}),
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 200)
        self.pending.refresh_from_db()
        self.assertFalse(self.pending.is_approved)

    def test_bulk_approve(self):
        other = Comment.objects.create(
            post=self.second_published,
            name="دیدگاه دوم",
            email="second@example.com",
            body="متن",
            is_approved=False,
        )
        response = self.client.post(
            reverse("blog:admin-comment-bulk-approve"),
            {"ids": [self.pending.id, other.id]},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["updated"], 2)
        self.assertTrue(Comment.objects.get(pk=other.id).is_approved)

    def test_bulk_approve_requires_ids(self):
        response = self.client.post(
            reverse("blog:admin-comment-bulk-approve"),
            {"ids": []},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 400)

    def test_delete_comment(self):
        response = self.client.delete(
            reverse("blog:admin-comment-detail", kwargs={"pk": self.pending.id}),
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Comment.objects.filter(pk=self.pending.id).exists())


class AdminTaxonomyApiTests(PanelTestData):
    def setUp(self):
        self.token = self.login()

    def test_create_rename_and_delete_a_category(self):
        created = self.client.post(
            reverse("blog:admin-category-list"),
            {"name": "دستهٔ تازه"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(created.status_code, 201, created.content)
        self.assertEqual(created.json()["slug"], "دسته-تازه")
        category_id = created.json()["id"]

        renamed = self.client.patch(
            reverse("blog:admin-category-detail", kwargs={"pk": category_id}),
            {"name": "دستهٔ ویرایش‌شده"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(renamed.status_code, 200)
        self.assertEqual(renamed.json()["name"], "دستهٔ ویرایش‌شده")

        deleted = self.client.delete(
            reverse("blog:admin-category-detail", kwargs={"pk": category_id}),
            **self.auth(self.token),
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Category.objects.filter(pk=category_id).exists())

    def test_category_list_counts_all_posts_including_drafts(self):
        response = self.client.get(
            reverse("blog:admin-category-list"), **self.auth(self.token)
        )
        counts = {item["slug"]: item["post_count"] for item in response.json()}
        self.assertEqual(counts["programming"], 1)

    def test_create_tag_on_the_fly(self):
        response = self.client.post(
            reverse("blog:admin-tag-list"),
            {"name": "تایپ‌اسکریپت"},
            content_type="application/json",
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Tag.objects.filter(name="تایپ‌اسکریپت").exists())


class AdminStatsApiTests(PanelTestData):
    def test_stats_payload(self):
        token = self.login()
        response = self.client.get(reverse("blog:admin-stats"), **self.auth(token))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["posts"]["total"], 3)
        self.assertEqual(payload["posts"]["published"], 2)
        self.assertEqual(payload["posts"]["draft"], 1)
        self.assertEqual(payload["taxonomy"]["categories"], 2)
        self.assertIn("pending", payload["comments"])
        self.assertLessEqual(len(payload["recent_posts"]), 5)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="blog-test-media-"))
class AdminUploadApiTests(PanelTestData):
    def setUp(self):
        self.token = self.login()

    @staticmethod
    def make_image(name="pic.png", image_format="PNG"):
        from PIL import Image

        buffer = io.BytesIO()
        Image.new("RGB", (12, 12), (90, 110, 200)).save(buffer, format=image_format)
        buffer.seek(0)
        content_type = "image/png" if image_format == "PNG" else "image/jpeg"
        return SimpleUploadedFile(name, buffer.read(), content_type=content_type)

    def test_upload_returns_absolute_url(self):
        response = self.client.post(
            reverse("blog:admin-upload"),
            {"file": self.make_image()},
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 201, response.content)
        url = response.json()["url"]
        self.assertTrue(url.startswith("http://"))
        self.assertIn("/media/uploads/", url)

    def test_upload_rejects_non_image_content_type(self):
        payload = SimpleUploadedFile(
            "notes.txt", b"just some text", content_type="text/plain"
        )
        response = self.client.post(
            reverse("blog:admin-upload"), {"file": payload}, **self.auth(self.token)
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("تصویری", response.json()["detail"])

    def test_upload_rejects_a_file_only_pretending_to_be_an_image(self):
        payload = SimpleUploadedFile(
            "evil.png", b"<script>alert(1)</script>", content_type="image/png"
        )
        response = self.client.post(
            reverse("blog:admin-upload"), {"file": payload}, **self.auth(self.token)
        )
        self.assertEqual(response.status_code, 400)

    def test_upload_rejects_oversized_files(self):
        with override_settings(MAX_UPLOAD_SIZE=10):
            response = self.client.post(
                reverse("blog:admin-upload"),
                {"file": self.make_image()},
                **self.auth(self.token),
            )
        self.assertEqual(response.status_code, 400)

    def test_upload_requires_staff(self):
        response = self.client.post(
            reverse("blog:admin-upload"), {"file": self.make_image()}
        )
        self.assertEqual(response.status_code, 401)

    def test_post_accepts_a_multipart_cover_image(self):
        response = self.client.post(
            reverse("blog:admin-post-list"),
            {
                "title": "نوشته با تصویر شاخص",
                "content": "<p>متن</p>",
                "status": "draft",
                "tags": [str(self.tag_django.id), "react"],
                "cover_image": self.make_image("cover.png"),
            },
            **self.auth(self.token),
        )
        self.assertEqual(response.status_code, 201, response.content)
        payload = response.json()
        self.assertTrue(payload["cover_image"].startswith("http://"))
        self.assertCountEqual(
            [tag["slug"] for tag in payload["tags"]], ["django", "react"]
        )
