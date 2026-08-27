"""Populate the database with Persian demo content for local development."""

import os
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from blog.models import Category, Comment, Post, Tag

User = get_user_model()

DEMO_AUTHOR = {
    "username": "demo_author",
    "email": "author@example.com",
    "first_name": "نویسنده",
    "last_name": "نمونه",
}

CATEGORIES = [
    {
        "name": "برنامه‌نویسی",
        "slug": "programming",
        "description": "نوشته‌هایی درباره زبان‌ها، ابزارها و تجربه‌های توسعه نرم‌افزار.",
    },
    {
        "name": "طراحی رابط کاربری",
        "slug": "design",
        "description": "از تایپوگرافی فارسی تا چیدمان راست‌به‌چپ و تجربه کاربری.",
    },
    {
        "name": "بهینه‌سازی موتور جستجو",
        "slug": "seo",
        "description": "راهکارهای دیده‌شدن محتوای فارسی در موتورهای جستجو.",
    },
]

TAGS = [
    ("جنگو", "django"),
    ("پایتون", "python"),
    ("ری‌اکت", "react"),
    ("وب", "web"),
    ("سئو", "seo-tag"),
    ("راست‌به‌چپ", "rtl"),
    ("عملکرد", "performance"),
]

LOREM = (
    "این متن نمونه برای نمایش ظاهر نوشته در وبلاگ است. لورم ایپسوم متن ساختگی "
    "با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. "
    "چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است. "
)

POSTS = [
    {
        "title": "شروع کار با جنگو برای ساخت وبلاگ فارسی",
        "slug": "getting-started-with-django",
        "category": "programming",
        "tags": ["django", "python"],
        "excerpt": "در این نوشته گام‌های نخست راه‌اندازی یک پروژه جنگو برای وبلاگ فارسی را مرور می‌کنیم.",
        "meta_title": "آموزش شروع کار با جنگو | وبلاگ فارسی",
        "meta_description": "راهنمای گام‌به‌گام راه‌اندازی پروژه جنگو، ساخت مدل‌ها و آماده‌سازی رابط برنامه‌نویسی برای وبلاگ فارسی.",
        "meta_keywords": "جنگو, پایتون, وبلاگ, آموزش",
    },
    {
        "title": "طراحی راست‌به‌چپ: نکته‌هایی که نباید فراموش کرد",
        "slug": "rtl-design-tips",
        "category": "design",
        "tags": ["rtl", "web"],
        "excerpt": "چیدمان راست‌به‌چپ تنها برگرداندن جهت صفحه نیست؛ از فاصله‌ها تا آیکون‌ها همه اهمیت دارند.",
        "meta_title": "نکات طراحی راست‌به‌چپ برای وب فارسی",
        "meta_description": "مجموعه‌ای از نکته‌های کاربردی برای طراحی رابط‌های راست‌به‌چپ و خوانا در وب فارسی.",
        "meta_keywords": "راست به چپ, طراحی, رابط کاربری",
    },
    {
        "title": "چطور محتوای فارسی را برای موتورهای جستجو بهینه کنیم",
        "slug": "persian-seo-guide",
        "category": "seo",
        "tags": ["seo-tag", "web"],
        "excerpt": "از انتخاب عنوان مناسب تا نقشه سایت و داده‌های ساختاریافته، مسیر دیده‌شدن محتوای فارسی.",
        "meta_title": "راهنمای سئوی محتوای فارسی",
        "meta_description": "بهینه‌سازی عنوان، توضیحات متا، نقشه سایت و ساختار نشانی‌ها برای محتوای فارسی.",
        "meta_keywords": "سئو, محتوای فارسی, نقشه سایت",
    },
    {
        "title": "رابط برنامه‌نویسی با جنگو رست فریم‌ورک",
        "slug": "django-rest-framework-api",
        "category": "programming",
        "tags": ["django", "python", "web"],
        "excerpt": "ساخت یک رابط برنامه‌نویسی تمیز و صفحه‌بندی‌شده با جنگو رست فریم‌ورک.",
        "meta_title": "ساخت API با جنگو رست فریم‌ورک",
        "meta_description": "آموزش ساخت سریالایزر، ویو و صفحه‌بندی در جنگو رست فریم‌ورک برای وبلاگ.",
        "meta_keywords": "جنگو رست فریم ورک, API, صفحه بندی",
    },
    {
        "title": "ری‌اکت و جنگو: جدا کردن رابط کاربری از سرور",
        "slug": "react-with-django",
        "category": "programming",
        "tags": ["react", "django", "web"],
        "excerpt": "چرا معماری جدا از هم برای پروژه‌های محتوایی مناسب است و چطور آن را پیاده کنیم.",
        "meta_title": "اتصال ری‌اکت به بک‌اند جنگو",
        "meta_description": "بررسی معماری جداشده، تنظیمات CORS و مصرف API جنگو در اپلیکیشن ری‌اکت.",
        "meta_keywords": "ری اکت, جنگو, CORS",
    },
    {
        "title": "سرعت بارگذاری صفحه؛ کوچک اما تعیین‌کننده",
        "slug": "page-speed-matters",
        "category": "design",
        "tags": ["performance", "web"],
        "excerpt": "تصویرهای بهینه، فونت‌های سبک و درخواست‌های کمتر؛ سه گام ساده برای صفحه‌ای سریع‌تر.",
        "meta_title": "بهبود سرعت بارگذاری صفحه‌های وب",
        "meta_description": "راهکارهای عملی برای کاهش زمان بارگذاری صفحه و بهبود تجربه کاربر.",
        "meta_keywords": "سرعت سایت, بهینه سازی, تجربه کاربری",
    },
    {
        "title": "پیش‌نویس: آنچه در نسخه بعدی وبلاگ می‌آید",
        "slug": "upcoming-features-draft",
        "category": "programming",
        "tags": ["django"],
        "excerpt": "این نوشته هنوز منتشر نشده است و تنها برای آزمایش وضعیت پیش‌نویس ساخته شده.",
        "status": Post.Status.DRAFT,
        "meta_title": "",
        "meta_description": "",
        "meta_keywords": "",
    },
]


class Command(BaseCommand):
    help = "Create demo categories, tags, posts and comments in Persian."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing blog content before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            Comment.objects.all().delete()
            Post.objects.all().delete()
            Tag.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing blog content removed."))

        self._configure_site()
        author = self._get_author()
        categories = self._create_categories()
        tags = self._create_tags()
        created_posts = self._create_posts(author, categories, tags)
        self._create_comments(created_posts)

        self.stdout.write(
            self.style.SUCCESS(
                "Seed complete: "
                f"{Category.objects.count()} categories, "
                f"{Tag.objects.count()} tags, "
                f"{Post.published.count()} published posts, "
                f"{Post.objects.count()} posts total, "
                f"{Comment.objects.count()} comments."
            )
        )

    def _configure_site(self):
        # Sitemap/feed URLs are built from the current Site; point it at the SPA.
        domain = os.environ.get("DJANGO_SITE_DOMAIN", "localhost:5173")
        Site.objects.update_or_create(
            pk=settings.SITE_ID,
            defaults={"domain": domain, "name": "وبلاگ رودیپ"},
        )

    def _get_author(self):
        author, created = User.objects.get_or_create(
            username=DEMO_AUTHOR["username"],
            defaults={
                "email": DEMO_AUTHOR["email"],
                "first_name": DEMO_AUTHOR["first_name"],
                "last_name": DEMO_AUTHOR["last_name"],
                "is_staff": True,
            },
        )
        if created:
            author.set_password("demo12345")
            author.save(update_fields=["password"])
            self.stdout.write(f"Created demo author '{author.username}'.")
        return author

    def _create_categories(self):
        categories = {}
        for data in CATEGORIES:
            category, _ = Category.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"], "description": data["description"]},
            )
            categories[data["slug"]] = category
        return categories

    def _create_tags(self):
        tags = {}
        for name, slug in TAGS:
            tag, _ = Tag.objects.get_or_create(slug=slug, defaults={"name": name})
            tags[slug] = tag
        return tags

    def _create_posts(self, author, categories, tags):
        now = timezone.now()
        posts = []
        for index, data in enumerate(POSTS):
            status = data.get("status", Post.Status.PUBLISHED)
            published_at = (
                now - timedelta(days=index * 3)
                if status == Post.Status.PUBLISHED
                else None
            )
            post, created = Post.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "title": data["title"],
                    "author": author,
                    "category": categories.get(data["category"]),
                    "excerpt": data["excerpt"],
                    "content": self._build_content(data["title"]),
                    "status": status,
                    "published_at": published_at,
                    "meta_title": data["meta_title"],
                    "meta_description": data["meta_description"],
                    "meta_keywords": data["meta_keywords"],
                    "canonical_url": f"https://example.com/posts/{data['slug']}/",
                },
            )
            if created:
                post.tags.set([tags[slug] for slug in data["tags"]])
                posts.append(post)
        return posts

    def _build_content(self, title):
        paragraphs = [f"## {title}", LOREM, LOREM, "### جمع‌بندی", LOREM]
        return "\n\n".join(paragraphs)

    def _create_comments(self, posts):
        for post in posts[:3]:
            Comment.objects.get_or_create(
                post=post,
                email="reader@example.com",
                defaults={
                    "name": "خواننده نمونه",
                    "body": "نوشته مفیدی بود، ممنون از اشتراک‌گذاری.",
                    "is_approved": True,
                },
            )
            Comment.objects.get_or_create(
                post=post,
                email="pending@example.com",
                defaults={
                    "name": "دیدگاه در انتظار",
                    "body": "این دیدگاه هنوز تأیید نشده است.",
                    "is_approved": False,
                },
            )
