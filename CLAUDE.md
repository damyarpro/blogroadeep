# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Persian-language (Farsi, RTL) blog website — «بلاگ رودیپ»:

- `backend/` — Django 5 + Django REST Framework API (SQLite in dev)
- `frontend/` — Vite + React 19 + TypeScript + Tailwind CSS v4 SPA

UI text and sample content are Persian; code identifiers, comments, and commit messages are English.

## Commands

Backend (from `backend/`):

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_blog                 # idempotent Persian demo data (staff user demo_author / demo12345); --flush resets
python manage.py runserver                 # http://127.0.0.1:8000
python manage.py test                      # full suite
python manage.py test blog.tests.PostListAPITests  # single test class
```

Test classes in `blog/tests.py`: public API — `PostListAPITests`, `PostDetailAPITests`, `TaxonomyAPITests`, `CommentCreateAPITests`, `SeoEndpointTests`, `SeedCommandTests`; authoring panel — `AuthAPITests`, `AdminApiPermissionTests`, `AdminPostApiTests`, `ContentSanitizationTests`, `AdminCommentApiTests`, `AdminTaxonomyApiTests`, `AdminStatsApiTests`, `AdminUploadApiTests`.

Frontend (from `frontend/`):

```bash
npm install
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:8000/api
npm run dev               # http://localhost:5173
npm run build             # tsc -b && vite build — must pass with zero TS errors
npm run lint              # oxlint
```

## Architecture

**Backend** — single app `blog` in project `config`:

- `blog/models.py`: `Category`, `Tag`, `Post`, `Comment`. Posts have draft/published status, per-post SEO fields (meta_title/meta_description/meta_keywords/canonical_url) with `seo_title`/`seo_description` fallbacks, Unicode-aware auto-slugs (Persian slugs allowed — URL patterns use `<str:slug>` because Django's `slug` converter is ASCII-only), and auto-computed `reading_time`. `Post.published` is a manager (`Post.published.all()`), the public API only ever serves published posts.
- `blog/serializers.py`: list serializer (light, no content) vs detail serializer (content + SEO + approved comments). Author is a nested object `{id, username, full_name}` — the frontend types mirror this.
- API under `/api/`: `posts/` (paginated 9/page, `?category=`, `?tag=`, `?author=`, `?search=`, `?ordering=`), `posts/<slug>/`, `posts/<slug>/comments/` (POST; always lands `is_approved=False` for moderation), `categories/`, `tags/`. This public API stays anonymous and read-only.
- **Authoring API** (`blog/admin_views.py`, `blog/admin_serializers.py`, `blog/admin_urls.py`) — token auth via `rest_framework.authtoken`:
  - `POST /api/auth/login/` → `{token, user{id, username, full_name, is_staff}}` (403 for non-staff), `POST /api/auth/logout/`, `GET /api/auth/me/`.
  - Everything under `/api/admin/` requires `IsAdminUser`: `posts/` (full CRUD incl. drafts, `?status=`, `?category=`, `?search=`, multipart `cover_image`, `tags` as ids **or** slugs, `remove_cover_image`), `posts/slug-available/?slug=&exclude=`, `categories/`, `tags/`, `comments/` (`?is_approved=`, `POST {id}/approve/`, `{id}/unapprove/`, `bulk-approve/`), `stats/`, `uploads/` (multipart image → absolute URL; images only, 5 MB cap from `MAX_UPLOAD_SIZE`).
- **HTML sanitization** (`blog/sanitize.py`, `nh3`): `Post.save()` runs `sanitize_html()` on `content`, so authored HTML is scrubbed on every write path (panel API, Django admin, management commands). The frontend renders content with `dangerouslySetInnerHTML` — never bypass this.
- SEO endpoints served by Django, not the SPA: `/sitemap.xml` (django.contrib.sitemaps + sites framework, `SITE_ID=1`, domain set by `seed_blog` / `DJANGO_SITE_DOMAIN` to point at the SPA), `/robots.txt`, `/feed/` (RSS).
- Env-overridable settings: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_SITE_DOMAIN`, `DJANGO_MAX_UPLOAD_SIZE`. CORS allows the Vite dev origin by default.

**Frontend** — SPA with react-router:

- `src/lib/api.ts` is the single API module; `src/lib/types.ts` mirrors the DRF payloads — when backend serializer fields change, update both.
- Routes: public site inside `Layout` (an `<Outlet/>` layout route) — `/`, `/articles` (search/filter/pagination state lives in URL query params), `/articles/:slug`, `/categories`, `/login`, `*`. The panel lives under `/admin` inside `AdminLayout`, wrapped in `RequireStaff`, and is `React.lazy`-loaded so readers never download the editor bundle.
- **Authoring panel** (`src/pages/admin/`, `src/components/admin/`): `/admin` dashboard, `/admin/posts`, `/admin/posts/new`, `/admin/posts/:id/edit`, `/admin/comments`, `/admin/taxonomy` — all Persian/RTL, dark-mode aware, `noIndex` on every page.
  - Auth: `src/lib/authToken.ts` (localStorage token, no React) + `src/lib/auth.tsx` (`AuthProvider` / `useAuth`, revalidates the stored token against `/api/auth/me/` on boot). `api.ts` attaches `Authorization: Token …` only on calls passing `auth: true`, so a stale token can never break public reads.
  - Editor: **Tiptap v3** (`@tiptap/react` + `@tiptap/starter-kit`, which already bundles link/underline/undo-redo, plus `@tiptap/extension-image` and `@tiptap/extension-placeholder`). Toolbar, inline image upload (also on paste/drop), collapsible SEO panel with SERP + social previews and a live checklist (`src/lib/seoChecks.ts`), localStorage autosave with a restore prompt, Ctrl/Cmd+S, and an unsaved-changes guard.
  - The editing surface reuses the public article's `.prose-fa` classes (defined in `src/index.css`) so the WYSIWYG is truthful — style headings/lists/quotes/code there, not per-page.
  - In static demo mode `RequireStaff` and `LoginPage` short-circuit to `StaticModeNotice`, and every `/api/admin/` helper rejects with a Persian "needs the Django backend" error.
- `src/components/seo/Seo.tsx` (react-helmet-async) owns all meta/OG/canonical/JSON-LD tags; article detail emits `BlogPosting` JSON-LD using API SEO fields with fallbacks. Keep one `h1` per page and semantic elements — SEO is a project requirement, not a nice-to-have.
- RTL/Persian: `<html lang="fa" dir="rtl">`, self-hosted Vazirmatn via @fontsource (never hotlink fonts), dates formatted with `Intl.DateTimeFormat('fa-IR')` helpers in `src/lib/format.ts`. Dark mode via `data-theme` + localStorage (inline script in `index.html` prevents theme flash).
- **Static demo mode** (no backend), deployed to GitHub Pages at https://damyarpro.github.io/blogroadeep/ by `.github/workflows/deploy-pages.yml` on push to `main`: build with `VITE_STATIC_DATA=true VITE_BASE=/blogroadeep/ npm run build`. `src/lib/api.ts` then serves `public/data/{posts,categories,tags}.json` (a snapshot of the live API — full post details, not just summaries) instead of fetching Django, doing search/filter/pagination client-side; comment submission is rejected with a Persian "disabled in the demo" error. `vite.config.ts` reads `base` from `VITE_BASE` (default `/`) and copies `dist/index.html` to `dist/404.html` for SPA routing on Pages; `main.tsx` passes the matching `basename` to `BrowserRouter`. See `frontend/README.md` for details on regenerating the snapshot.

## Agent Rules (قوانین ایجنت)

1. **Language / زبان**: Always communicate with the user in Persian (Farsi). All chat responses, explanations, and questions to the user must be in Persian. Code, identifiers, and commit messages stay in English. User-facing site text is Persian.
2. **Keep this file current**: when commands or architecture change, update this file.
3. **Branching**: Never commit directly to `main`; develop on a feature branch and open a pull request.
4. **License**: The project is MIT-licensed; keep the existing LICENSE file intact.
5. **Scope**: Make only the changes the user asked for; ask before destructive or hard-to-reverse actions (deleting files, force-pushing, rewriting history).
6. **Verification**: before committing, run `python manage.py test` (backend) and `npm run build` (frontend); both must pass.

## Model Roles (نقش مدل‌ها)

When orchestrating multi-agent work (subagents, workflows), assign models by this hierarchy:

- **Fable** — orchestrator and planner: overall planning, task decomposition, analysis, code review, and testing/verification of the other agents' output.
- **Opus** — first (primary) implementation agent: the main complex implementation tasks.
- **Sonnet** — second implementation agent: standard implementation tasks and parallel workstreams.
- **Smaller models (e.g., Haiku)** — routine/mechanical tasks: simple searches, bulk edits, formatting, and other low-complexity work.
