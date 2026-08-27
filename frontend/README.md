# بلاگ رودیپ — frontend

React (TypeScript) + Vite frontend for the Persian-language (RTL) blog. Talks to the
Django REST API defined in `../backend`.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- react-router-dom (client-side routing)
- react-helmet-async (per-page SEO tags)
- `@fontsource/vazirmatn` — Vazirmatn is self-hosted via npm, not loaded from a CDN

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if the API isn't on localhost:8000
npm run dev             # http://localhost:5173
```

## Build

```bash
npm run build   # tsc -b && vite build — must pass with zero TypeScript errors
npm run preview # serve the production build locally
```

The build always copies `dist/index.html` to `dist/404.html` (a `vite.config.ts` plugin),
which is what makes client-side routing survive a hard refresh on GitHub Pages.

## Static demo mode (GitHub Pages)

The app can also be built as a fully static, backend-free demo — served at
https://damyarpro.github.io/blogroadeep/ by `.github/workflows/deploy-pages.yml` on
every push to `main`. In this mode `src/lib/api.ts` reads from the pre-fetched JSON
snapshot in `public/data/` (`posts.json`, `categories.json`, `tags.json`) instead of
calling Django, doing search/filter/sort/pagination client-side. Every page's public
function signature is unchanged, so components don't know which mode is active.

```bash
VITE_STATIC_DATA=true VITE_BASE=/blogroadeep/ npm run build
```

- `VITE_STATIC_DATA=true` switches `src/lib/api.ts` to the static snapshot.
- `VITE_BASE` sets Vite's `base` (and the react-router `basename`) to the GitHub Pages
  project subpath; omit it (or leave it as `/`) for a root deploy.

What doesn't work in static mode: comment submission (the form shows a Persian
"disabled in the demo" error instead of posting) and the RSS link in the footer
(hidden — RSS is served by Django). Search, category/tag filters, and pagination all
still work — they just run against the snapshot in the browser instead of the API.

To refresh the snapshot after seeding new demo data, run the Django backend locally
and re-fetch `/api/posts/` (and each post's `/api/posts/<slug>/` detail) plus
`/api/categories/` and `/api/tags/` into `public/data/`.

## Project layout

- `src/lib/api.ts` — single module for all backend calls (typed fetch wrappers); adjust
  here first if backend field/route names drift from the current contract.
- `src/lib/types.ts` — TypeScript types for API entities.
- `src/lib/format.ts` — fa-IR date and reading-time formatting helpers.
- `src/components/layout` — header, footer, page shell, dark-mode toggle.
- `src/components/cards` — post card, cover image (with placeholder fallback), tags,
  share links, comment list/form.
- `src/components/common` — loading skeletons, error state, pagination.
- `src/components/seo/Seo.tsx` — reusable `<Seo>` head component (title, meta
  description, canonical, Open Graph, Twitter card, optional JSON-LD).
- `src/pages` — route-level components (`/`, `/articles`, `/articles/:slug`,
  `/categories`, 404).

## Routing

| Path               | Page                                          |
| ------------------ | ---------------------------------------------- |
| `/`                 | Home — hero + latest posts                    |
| `/articles`         | Search, category filter, pagination (URL-synced) |
| `/articles/:slug`   | Full article, comments, related posts, share links |
| `/categories`       | Category index                                |
| `*`                 | 404 page                                      |

## SEO notes

- `public/robots.txt` here is a placeholder for the Vite dev/preview build only.
  **In production, `/robots.txt` and the sitemap are served by the Django backend**,
  which owns crawl rules and canonical URLs for the deployed domain — this SPA's copy
  is not what production serves.
- Article pages emit `BlogPosting` JSON-LD using the API's `meta_title` /
  `meta_description` (falling back to `title` / `excerpt`) plus `published_at` and
  `author_name`.
