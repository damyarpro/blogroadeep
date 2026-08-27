# بلاگ رودیپ (blogroadeep)

یک وبسایت بلاگ فارسی با فرانت‌اند **React + Tailwind** و بک‌اند **Django REST**.

A Persian-language blog: React 19 + TypeScript + Tailwind v4 frontend (RTL, dark mode, SEO-ready) backed by a Django 5 + DRF API with sitemap, RSS, and comment moderation.

## Quick start

Backend (http://127.0.0.1:8000):

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_blog          # Persian demo content (add --flush to reset)
python manage.py runserver
```

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Features

- Blog home, articles list (debounced search, category filter, pagination synced to URL), article detail, categories page — all Persian/RTL with Vazirmatn.
- SEO: per-page meta/OG/twitter tags, canonical URLs, `BlogPosting` JSON-LD, semantic HTML; Django serves `sitemap.xml`, `robots.txt`, and RSS at `/feed/`.
- Posts with categories, tags, cover images, reading time, and per-post SEO overrides (meta title/description/keywords, canonical).
- Moderated comments (submitted via the site, approved in Django admin).
- Django admin with slug prepopulation, bulk publish/approve actions.

## Tests

```bash
cd backend && python manage.py test    # API, SEO endpoints, moderation
cd frontend && npm run build           # type-checks and builds
```

## License

MIT
