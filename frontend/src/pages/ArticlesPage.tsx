import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPosts, fetchCategories, ApiError } from '../lib/api';
import type { Category, PostSummary } from '../lib/types';
import { PostCard, type CardTone } from '../components/cards/PostCard';
import { PostGridSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { toPersianDigits } from '../lib/format';

const DEFAULT_PAGE_SIZE = 12;

/* Radius system: block surfaces = rounded-3xl, inset media = rounded-2xl,
   anything pressable = rounded-full. */

/** Two solid tiles per grid page keep the bento rhythm without looking random. */
function toneFor(index: number): CardTone {
  if (index === 0) return 'ink';
  if (index === 4) return 'mint';
  return 'bone';
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </svg>
  );
}

/** Circular arrow buttons plus a page indicator: lighter than a numbered strip. */
function ArticlesPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const buttonClass =
    'press inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-950 text-bone-50 transition-colors duration-150 hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ink-400 disabled:ring-1 disabled:ring-bone-300 dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400 dark:disabled:bg-transparent dark:disabled:text-ink-400 dark:disabled:ring-ink-700';

  return (
    <nav
      aria-label="صفحه‌بندی"
      className="mt-14 flex items-center justify-between gap-4 border-t border-bone-300 pt-8 dark:border-ink-800"
    >
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className={buttonClass} aria-label="صفحه قبل">
        <Arrow className="h-5 w-5 rotate-180" />
      </button>

      <p aria-live="polite" className="text-sm font-bold whitespace-nowrap text-ink-950 dark:text-bone-100">
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
      </p>

      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={buttonClass} aria-label="صفحه بعد">
        <Arrow className="h-5 w-5" />
      </button>
    </nav>
  );
}

export function ArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const searchQuery = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Keep the text input in sync if the URL changes from elsewhere (e.g. back button).
  useEffect(() => {
    setSearchInput(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Push debounced search text into the URL (resets to page 1).
  useEffect(() => {
    if (debouncedSearch === searchQuery) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPosts({ page, search: searchQuery || undefined, category: category || undefined, tag: tag || undefined })
      .then((data) => {
        if (cancelled) return;
        setPosts(data.results);
        setCount(data.count);
        if (page === 1 && data.results.length > 0) setPageSize(data.results.length);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'خطای غیرمنتظره‌ای رخ داد.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, searchQuery, category, tag, reloadKey]);

  function setCategory(slug: string) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('category', slug);
    else next.delete('category');
    next.delete('page');
    setSearchParams(next);
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearFilters() {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const hasFilters = Boolean(searchQuery || category || tag);
  const activeCategory = categories.find((cat) => cat.slug === category);

  const chipClass = (active: boolean) =>
    [
      'press rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors duration-150',
      active
        ? 'bg-ink-950 text-mint-300 dark:bg-mint-300 dark:text-ink-950'
        : 'bg-bone-200 text-ink-950 hover:bg-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950',
    ].join(' ');

  return (
    <>
      <Seo title="مقالات" description="فهرست مقالات بلاگ رودیپ همراه با امکان جستجو و فیلتر بر اساس دسته‌بندی." canonicalPath="/articles" />

      {/* Section 1 of 3: asymmetric page header, title on one side, tally on the other. */}
      <section className="border-b border-bone-300 dark:border-ink-800">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-16 pb-12 sm:px-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1
              className="rise text-[2.75rem] leading-[1.1] font-black tracking-tight text-ink-950 sm:text-6xl dark:text-bone-50"
              style={{ '--rise-delay': '0ms' } as React.CSSProperties}
            >
              مقالات
            </h1>
            <p
              className="rise mt-5 max-w-lg leading-8 text-ink-600 dark:text-bone-300"
              style={{ '--rise-delay': '60ms' } as React.CSSProperties}
            >
              همهٔ نوشته‌ها یک‌جا. با جستجو یا دسته‌بندی، سریع‌تر به آنچه می‌خواهید برسید.
            </p>
          </div>

          <p
            className="rise lg:col-span-4 lg:justify-self-end lg:pb-2"
            style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            aria-live="polite"
          >
            <span className="inline-block rounded-full bg-bone-200 px-4 py-2 text-sm font-bold text-ink-950 dark:bg-ink-800 dark:text-bone-100">
              {loading ? 'در حال بارگذاری…' : `${toPersianDigits(count)} مقاله`}
              {!loading && activeCategory && <span className="font-normal opacity-70"> در {activeCategory.name}</span>}
            </span>
          </p>
        </div>
      </section>

      {/* Section 2 of 3: control row, deliberately not boxed like the header band. */}
      <section className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <label htmlFor="article-search" className="sr-only">
          جستجو در مقالات
        </label>
        <div className="relative w-full sm:max-w-sm">
          <input
            id="article-search"
            type="search"
            placeholder="جستجو در مقالات…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-full border border-bone-300 bg-bone-50 py-3.5 pe-12 ps-12 text-sm text-ink-950 outline-none transition-colors duration-150 placeholder:text-ink-400 focus:border-forest-800 focus:ring-2 focus:ring-mint-400/60 dark:border-ink-700 dark:bg-ink-900 dark:text-bone-50 dark:focus:border-mint-300 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
            className="pointer-events-none absolute start-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600 dark:text-bone-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>

          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="پاک کردن جستجو"
              className="press absolute end-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bone-200 text-ink-950 transition-colors duration-150 hover:bg-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="فیلتر بر اساس دسته‌بندی">
            <button type="button" onClick={() => setCategory('')} className={chipClass(!category)} aria-pressed={!category}>
              همه
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={chipClass(category === cat.slug)}
                aria-pressed={category === cat.slug}
              >
                {cat.name}
                <span className="ms-2 font-normal opacity-70">{toPersianDigits(cat.post_count)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 of 3: results. */}
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-20 sm:px-6">
        {loading && <PostGridSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && posts.length === 0 && (
          <div className="rise mx-auto max-w-lg rounded-[2rem] bg-mint-300 px-6 py-16 text-center sm:px-10">
            <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-950 text-mint-300">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <p className="mt-6 text-3xl font-black tracking-tight text-ink-950">نتیجه‌ای پیدا نشد</p>
            <p className="mt-3 leading-7 text-forest-900">
              {hasFilters
                ? 'با این جستجو یا فیلتر مقاله‌ای نداریم. عبارت دیگری را امتحان کنید یا فیلترها را بردارید.'
                : 'هنوز مقاله‌ای منتشر نشده است. به‌زودی سر بزنید.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="press mt-7 rounded-full bg-ink-950 px-7 py-3 text-sm font-bold whitespace-nowrap text-bone-50 transition-colors duration-150 hover:bg-forest-900"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <div key={post.id} className="rise" style={{ '--rise-delay': `${index * 45}ms` } as React.CSSProperties}>
                  <PostCard post={post} tone={toneFor(index)} />
                </div>
              ))}
            </div>
            <ArticlesPagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </section>
    </>
  );
}
