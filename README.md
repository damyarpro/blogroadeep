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
- Moderated comments (submitted via the site, approved from the in-site panel or Django admin).
- **In-site author panel** at `/admin` (token auth, staff only): dashboard, post list with search/filters/publish/delete, a Tiptap rich-text editor with inline image upload, cover images, tag create-on-the-fly, a full SEO panel (meta fields, live Google/social previews, real-time checklist), localStorage autosave, comment moderation with bulk approve, and category/tag management — all Persian/RTL and `noindex`.
- Authored HTML is sanitized server-side with `nh3` on every save, so nothing unsafe reaches the article page.
- Django admin with slug prepopulation, bulk publish/approve actions.

### Signing in to the panel

`python manage.py seed_blog` creates a staff user `demo_author` / `demo12345`. Visit
http://localhost:5173/login, sign in, and the panel link appears in the site header.
The panel needs the Django backend — the static GitHub Pages demo shows a Persian
notice instead.

## Tests

```bash
cd backend && python manage.py test    # API, SEO endpoints, moderation
cd frontend && npm run build           # type-checks and builds
```

## License

MIT
