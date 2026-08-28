import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPosts, fetchCategories, ApiError } from '../lib/api';
import type { Category, PostSummary } from '../lib/types';
import { PostCard } from '../components/cards/PostCard';
import { PostGridSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { toPersianDigits } from '../lib/format';

const DEFAULT_PAGE_SIZE = 12;

/* Radius system: surfaces = rounded-2xl, anything pressable = rounded-full. */

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
    </svg>
  );
}

/** Prev/next with a page indicator: lighter than a numbered strip and easier on mobile. */
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
    'press inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-transparent disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:disabled:border-slate-800 dark:disabled:text-slate-600';

  return (
    <nav
      aria-label="صفحه‌بندی"
      className="mt-12 flex items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800"
    >
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className={buttonClass}>
        <Chevron className="h-4 w-4 rotate-180" />
        <span className="whitespace-nowrap">قبلی</span>
      </button>

      <p aria-live="polite" className="text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
      </p>

      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={buttonClass}>
        <span className="whitespace-nowrap">بعدی</span>
        <Chevron className="h-4 w-4" />
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
      'press rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors duration-150',
      active
        ? 'bg-indigo-600 font-medium text-white hover:bg-indigo-700'
        : 'border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300',
    ].join(' ');

  return (
    <>
      <Seo title="مقالات" description="فهرست مقالات بلاگ رودیپ همراه با امکان جستجو و فیلتر بر اساس دسته‌بندی." canonicalPath="/articles" />

      {/* Section 1 of 3: asymmetric page header, title on one side, tally on the other. */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45rem_20rem_at_15%_-40%,var(--color-indigo-100),transparent_70%)] dark:bg-[radial-gradient(45rem_20rem_at_15%_-40%,var(--color-indigo-950),transparent_70%)]"
        />

        <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-16 pb-12 sm:px-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1
              className="rise text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl dark:text-white"
              style={{ '--rise-delay': '0ms' } as React.CSSProperties}
            >
              مقالات
            </h1>
            <p
              className="rise mt-4 max-w-lg leading-8 text-slate-600 dark:text-slate-400"
              style={{ '--rise-delay': '60ms' } as React.CSSProperties}
            >
              همهٔ نوشته‌ها یک‌جا. با جستجو یا دسته‌بندی، سریع‌تر به آنچه می‌خواهید برسید.
            </p>
          </div>

          <p
            className="rise text-sm text-slate-500 lg:col-span-4 lg:justify-self-end lg:pb-2 dark:text-slate-400"
            style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            aria-live="polite"
          >
            {loading ? 'در حال بارگذاری…' : `${toPersianDigits(count)} مقاله`}
            {!loading && activeCategory && <span className="text-slate-400 dark:text-slate-500"> در {activeCategory.name}</span>}
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
            className="w-full rounded-full border border-slate-300 bg-white py-3 pe-11 ps-11 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>

          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="پاک کردن جستجو"
              className="press absolute end-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
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
                <span className={category === cat.slug ? 'ms-2 text-indigo-200' : 'ms-2 text-slate-400 dark:text-slate-600'}>
                  {toPersianDigits(cat.post_count)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 of 3: results. */}
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6">
        {loading && <PostGridSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && posts.length === 0 && (
          <div className="rise mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={1.4}
              stroke="currentColor"
              aria-hidden="true"
              className="mx-auto h-11 w-11 text-slate-300 dark:text-slate-600"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <p className="mt-5 text-lg font-bold text-slate-900 dark:text-white">نتیجه‌ای پیدا نشد</p>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              {hasFilters
                ? 'با این جستجو یا فیلتر مقاله‌ای نداریم. عبارت دیگری را امتحان کنید یا فیلترها را بردارید.'
                : 'هنوز مقاله‌ای منتشر نشده است. به‌زودی سر بزنید.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="press mt-6 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-indigo-700"
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
                  <PostCard post={post} />
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
