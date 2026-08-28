# بریف بک‌اند — پروژهٔ «بلاگ رودیپ»

سند سفارش کار برای توسعه‌دهندهٔ بک‌اند. فرانت‌اند این پروژه (React + TypeScript، فارسی و راست‌چین) آماده و مستقر است و به یک REST API با قرارداد مشخص وصل می‌شود. کار شما ساخت همین API است، نه طراحی از صفر.

- دموی زندهٔ فرانت: https://damyarpro.github.io/blogroadeep/
- مخزن: https://github.com/damyarpro/blogroadeep — قرارداد دقیق پاسخ‌ها در `frontend/src/lib/types.ts` و نحوهٔ فراخوانی در `frontend/src/lib/api.ts`
- یک پیاده‌سازی مرجع با Django در پوشهٔ `backend/` موجود است؛ می‌توانید از آن الگو بگیرید یا با استک خودتان بسازید، به شرط رعایت قرارداد.

---

## ۱. محدودهٔ کار (Scope)

| هست | نیست |
|---|---|
| API عمومی خواندن مقالات، دسته‌بندی‌ها، برچسب‌ها | ورود، ثبت‌نام، حساب کاربری، JWT، OAuth |
| API نوشتن/ویرایش مقاله برای صفحهٔ «نوشتن مقاله» | پنل ادمین اختصاصی (فرانتش موجود است) |
| تاریخچهٔ نسخه‌های هر مقاله (History) و بازگردانی | سیستم چندنویسنده و سطح دسترسی |
| ثبت دیدگاه + تأیید دیدگاه | خبرنامه، نوتیفیکیشن، جستجوی full-text پیشرفته |
| زیرساخت کامل SEO (متا، سایت‌مپ، RSS، robots) | |
| آپلود تصویر برای متن و کاور | |

## ۲. تصمیم امنیتی (مهم — حتماً بخوانید)

**حساب کاربری و صفحهٔ ورود نداریم**، اما مسیرهای نوشتن نباید بدون محافظ روی اینترنت باز باشند. راه‌حل:

- یک **کلید ثابت** در متغیر محیطی تعریف شود: `WRITE_API_KEY`
- تمام مسیرهای نوشتن/مدیریت، هدر `X-Api-Key: <کلید>` را الزامی کنند؛ نبود یا اشتباه بودن کلید → `401`
- مسیرهای خواندن عمومی و ثبت دیدگاه، بدون کلید و آزادند
- فرانت این کلید را از یک فیلد سادهٔ تنظیمات می‌گیرد (بدون فرم ورود). Rate-limit روی ثبت دیدگاه (مثلاً ۵ دیدگاه در دقیقه به‌ازای IP) اعمال شود.

## ۳. مدل داده

### Post
| فیلد | نوع | توضیح |
|---|---|---|
| `title` | string | |
| `slug` | string, unique | **باید حروف فارسی را بپذیرد** (Unicode slug). اگر خالی بود از عنوان ساخته شود |
| `excerpt` | text | خلاصه |
| `content` | text (HTML) | خروجی ادیتور غنی — حتماً بخش ۷ (پاک‌سازی) را ببینید |
| `cover_image` | file, nullable | |
| `category` | FK → Category, nullable | |
| `tags` | M2M → Tag | |
| `status` | `draft` \| `published` | API عمومی فقط `published` را برگرداند |
| `published_at` | datetime | ورودی/خروجی ISO 8601 (تبدیل شمسی سمت فرانت انجام می‌شود) |
| `reading_time` | int | خودکار از طول متن (حدود ۲۰۰ کلمه در دقیقه) |
| `meta_title`, `meta_description`, `meta_keywords`, `canonical_url` | string, blank | فیلدهای SEO با fallback به عنوان/خلاصه |
| `created_at`, `updated_at` | datetime | |

### PostRevision (تاریخچه)
در **هر ذخیرهٔ موفق** مقاله، یک نسخه ثبت شود: `post`، `title`، `excerpt`، `content`، فیلدهای SEO، `saved_at`، و `note` اختیاری. حداکثر ۵۰ نسخهٔ آخر هر مقاله نگه داشته شود (قدیمی‌ترها حذف شوند).

### Category و Tag
`name` + `slug` یونیکد یکتا (+ `description` برای Category).

### Comment
`post` (FK) + `name` + `email` + `body` + `created_at` + `is_approved` (پیش‌فرض `false`).

## ۴. API عمومی (بدون کلید، فقط خواندنی)

قرارداد پاسخ‌ها باید **دقیقاً** با `frontend/src/lib/types.ts` بخواند. خلاصه:

| متد | مسیر | توضیح |
|---|---|---|
| GET | `/api/posts/` | فقط published؛ صفحه‌بندی **۹تایی** با شکل `{count, next, previous, results}`؛ پارامترها: `?page=`, `?search=` (روی عنوان/خلاصه/متن), `?category=<slug>`, `?tag=<slug>`, `?ordering=` |
| GET | `/api/posts/<slug>/` | نسخهٔ کامل + فیلدهای SEO + دیدگاه‌های تأییدشده؛ پیش‌نویس → `404` |
| POST | `/api/posts/<slug>/comments/` | بدنه: `{name, email, body}` → ثبت با `is_approved=false` و پاسخ `201` |
| GET | `/api/categories/` , `/api/tags/` | همراه `post_count` (فقط مقالات منتشرشده) |

نکتهٔ قرارداد: `author` در پاسخ‌ها یک آبجکت است `{id, username, full_name}`. چون حساب کاربری ندارید، مقدار آن از تنظیمات سایت پر شود (نام نویسندهٔ ثابت وبلاگ).

## ۵. API نوشتن (با هدر `X-Api-Key`)

| متد | مسیر | توضیح |
|---|---|---|
| GET | `/api/admin/posts/` | همهٔ مقالات شامل پیش‌نویس‌ها؛ `?status=`, `?search=`, `?category=` |
| POST | `/api/admin/posts/` | ساخت مقاله؛ `multipart` برای `cover_image`؛ `tags` با id **یا** slug (برچسب جدید ساخته شود) |
| GET/PATCH/DELETE | `/api/admin/posts/<id>/` | ویرایش جزئی؛ `remove_cover_image=true` برای حذف کاور |
| GET | `/api/admin/posts/slug-available/?slug=&exclude=` | بررسی زندهٔ یکتا بودن نامک |
| GET | `/api/admin/posts/<id>/revisions/` | فهرست تاریخچه (شناسه، تاریخ، عنوان، خلاصهٔ تغییر) |
| POST | `/api/admin/posts/<id>/revisions/<rev_id>/restore/` | بازگردانی نسخه (خودِ بازگردانی هم یک نسخهٔ جدید ثبت کند) |
| GET | `/api/admin/comments/?is_approved=` | فهرست دیدگاه‌ها |
| POST | `/api/admin/comments/<id>/approve/` و `unapprove/` و `bulk-approve/` | تأیید تکی/گروهی |
| DELETE | `/api/admin/comments/<id>/` | حذف |
| POST | `/api/admin/uploads/` | آپلود تصویر برای متن؛ فقط `image/*`، سقف ۵MB؛ پاسخ: `{url}` مطلق |
| GET/POST/PATCH/DELETE | `/api/admin/categories/` , `/api/admin/tags/` | مدیریت دسته و برچسب |

## ۶. الزامات SEO (سمت سرور، خارج از SPA)

- `GET /sitemap.xml` — صفحات ایستا + مقالات منتشرشده + دسته‌بندی‌ها، با `lastmod`؛ دامنهٔ لینک‌ها از env: `SITE_DOMAIN`
- `GET /robots.txt` — allow all، مسیرهای مدیریتی disallow، آدرس سایت‌مپ
- `GET /feed/` — RSS 2.0 آخرین ۲۰ مقالهٔ منتشرشده
- فیلدهای متا در پاسخ جزئیات مقاله همیشه پر برگردند: اگر `meta_title` خالی است عنوان، اگر `meta_description` خالی است خلاصه
- نامک‌ها تغییرناپذیر بمانند مگر با درخواست صریح (تغییر نامک = شکستن لینک‌ها)

## ۷. پاک‌سازی HTML (الزام امنیتی، غیرقابل مذاکره)

`content` خروجی ادیتور غنی است و فرانت آن را مستقیم رندر می‌کند. **در هر ذخیره** سمت سرور با کتابخانهٔ معتبر (nh3 / bleach / sanitize-html) پاک‌سازی شود:

- تگ‌های مجاز: ساختار متن (p, br, h2–h4, blockquote, ul/ol/li, hr)، تأکیدها (strong, em, u, s, mark, sub, sup)، کد (code, pre)، لینک (a با rel="noopener noreferrer")، تصویر (img)، جدول کامل (table/thead/tbody/tr/th/td/colgroup/col)، figure/figcaption
- اتریبیوت `dir` روی همهٔ تگ‌ها مجاز (متن دوجهتهٔ فارسی/انگلیسی)
- `style` فقط با فیلتر سخت‌گیرانه: `text-align` روی p و h2–h4، و `background-color` (فقط hex/rgb معتبر) روی mark — هر مقدار دیگر، کل اتریبیوت حذف شود
- `script`, `iframe`, `on*`, `javascript:` مطلقاً حذف

## ۸. قواعد فنی

- CORS برای دامنهٔ فرانت (env: `CORS_ALLOWED_ORIGINS`)
- تایم‌زون `Asia/Tehran`؛ همهٔ تاریخ‌ها در API به ISO 8601
- تنظیمات حساس فقط از env: `SECRET_KEY`, `WRITE_API_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `SITE_DOMAIN`, `MAX_UPLOAD_SIZE`
- دیتابیس: توسعه SQLite، محصول PostgreSQL (تنظیم با env)
- یک دستور seed برای دادهٔ نمونهٔ فارسی (۵–۶ مقاله، ۳ دسته، چند برچسب و دیدگاه)

## ۹. معیارهای پذیرش (بدون این‌ها تحویل کامل نیست)

- [ ] فرانت موجود بدون هیچ تغییری در کدش به API وصل شود و همهٔ صفحات کار کنند
- [ ] مسیرهای نوشتن بدون `X-Api-Key` درست `401` بدهند؛ با کلید، کل چرخهٔ ساخت → ویرایش → انتشار → نمایش عمومی کار کند
- [ ] پیش‌نویس در API عمومی `404` باشد و در سایت‌مپ/RSS نیاید
- [ ] هر ذخیره یک Revision بسازد؛ بازگردانی نسخه تست شده باشد
- [ ] دیدگاه جدید تا قبل از تأیید در خروجی عمومی نیاید؛ تأیید گروهی کار کند
- [ ] `<script>` و اتریبیوت‌های event در محتوای ذخیره‌شده باقی نمانند (تست بنویسید)
- [ ] sitemap و RSS و robots معتبر باشند (اعتبارسنج XML پاس شود)
- [ ] آپلود غیر تصویر و بالای ۵MB رد شود
- [ ] پوشش تست برای همهٔ موارد بالا + مستند کوتاه راه‌اندازی (README)

## ۱۰. غیرهدف‌ها (که وقت رویشان نگذارید)

ورود/ثبت‌نام، فراموشی رمز، پروفایل، چندنویسنده، لایک/امتیاز، جستجوی الاستیک، کش پیشرفته، GraphQL.
