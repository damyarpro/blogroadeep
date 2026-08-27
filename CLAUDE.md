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
python manage.py seed_blog                 # idempotent Persian demo data; --flush resets
python manage.py runserver                 # http://127.0.0.1:8000
python manage.py test                      # full suite
python manage.py test blog.tests.PostListAPITests  # single test class (others: PostDetailAPITests, TaxonomyAPITests, CommentCreateAPITests, SeoEndpointTests, SeedCommandTests)
```

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
- API under `/api/`: `posts/` (paginated 9/page, `?category=`, `?tag=`, `?author=`, `?search=`, `?ordering=`), `posts/<slug>/`, `posts/<slug>/comments/` (POST; always lands `is_approved=False` for moderation), `categories/`, `tags/`.
- SEO endpoints served by Django, not the SPA: `/sitemap.xml` (django.contrib.sitemaps + sites framework, `SITE_ID=1`, domain set by `seed_blog` / `DJANGO_SITE_DOMAIN` to point at the SPA), `/robots.txt`, `/feed/` (RSS).
- Env-overridable settings: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_SITE_DOMAIN`. CORS allows the Vite dev origin by default.

**Frontend** — SPA with react-router:

- `src/lib/api.ts` is the single API module; `src/lib/types.ts` mirrors the DRF payloads — when backend serializer fields change, update both.
- Routes: `/`, `/articles` (search/filter/pagination state lives in URL query params), `/articles/:slug`, `/categories`, `*`.
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
