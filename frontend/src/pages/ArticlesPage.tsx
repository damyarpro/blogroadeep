import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPosts, fetchCategories, ApiError } from '../lib/api';
import type { Category, PostSummary } from '../lib/types';
import { PhotoCard, PhotoCardSkeleton } from '../components/magazine/PhotoCard';
import { PageHeader } from '../components/magazine/PageHeader';
import {
  WIDE,
  cardShell,
  pillShell,
  chipClass,
  chipCountClass,
  circleButtonClass,
  solidPill,
} from '../components/magazine/tokens';
import { ArrowIcon, SearchIcon } from '../components/home/icons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { toPersianDigits } from '../lib/format';

const DEFAULT_PAGE_SIZE = 12;

/* The magazine index. Same card, same chips and same measure as the home page,
   so moving between the two reads as one publication. */

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

  return (
    <nav
      aria-label="صفحه‌بندی"
      className={`mt-14 flex items-center justify-between gap-4 px-5 py-4 sm:px-7 ${cardShell}`}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={circleButtonClass}
        aria-label="صفحه قبل"
      >
        <ArrowIcon className="h-5 w-5 rotate-180" />
      </button>

      <p aria-live="polite" className="text-sm font-bold whitespace-nowrap text-ink-950 dark:text-bone-100">
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
      </p>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={circleButtonClass}
        aria-label="صفحه بعد"
      >
        <ArrowIcon className="h-5 w-5" />
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

  // The masthead's search button links here with ?focus=search; honour it once,
  // then drop the parameter so the URL stays clean and shareable.
  useEffect(() => {
    if (searchParams.get('focus') !== 'search') return;
    document.getElementById('article-search')?.focus();
    const next = new URLSearchParams(searchParams);
    next.delete('focus');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  return (
    <>
      <Seo title="مقالات" description="فهرست مقالات بلاگ رودیپ همراه با امکان جستجو و فیلتر بر اساس دسته‌بندی." canonicalPath="/articles" />

      {/* Section 1 of 3: the same centred display header the home page opens with. */}
      <PageHeader
        title="همهٔ نوشته‌ها یک‌جا"
        subtitle="با جستجو یا انتخاب موضوع، سریع‌تر به آنچه می‌خواهید برسید."
      >
        <span
          aria-live="polite"
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-ink-950 dark:text-bone-100 ${pillShell}`}
        >
          {loading ? 'در حال بارگذاری…' : `${toPersianDigits(count)} مقاله`}
          {!loading && activeCategory && (
            <span className="font-normal text-ink-600 dark:text-bone-300">در {activeCategory.name}</span>
          )}
        </span>
      </PageHeader>

      {/* Section 2 of 3: the search field, then the subject rail from the home page. */}
      <section className={`${WIDE} pt-2`} aria-label="جستجو و فیلتر">
        <label htmlFor="article-search" className="sr-only">
          جستجو در مقالات
        </label>
        <div className={`relative mx-auto w-full max-w-xl overflow-hidden ${pillShell}`}>
          <input
            id="article-search"
            type="search"
            placeholder="جستجو در مقالات…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-full bg-transparent py-3.5 pe-14 ps-12 text-sm text-ink-950 outline-none transition-colors duration-150 placeholder:text-ink-400 focus:ring-2 focus:ring-mint-400/60 dark:text-bone-50 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <SearchIcon className="pointer-events-none absolute start-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600 dark:text-bone-400" />

          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="پاک کردن جستجو"
              className="press absolute end-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bone-200 text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="snap-row -mx-4 mt-6 flex justify-start gap-3 overflow-x-auto px-4 py-2 sm:-mx-6 sm:px-6 lg:justify-center" role="group" aria-label="فیلتر بر اساس دسته‌بندی">
            <button type="button" onClick={() => setCategory('')} className={`shrink-0 ${chipClass(!category)}`} aria-pressed={!category}>
              همه
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={`shrink-0 ${chipClass(category === cat.slug)}`}
                aria-pressed={category === cat.slug}
              >
                {cat.name}
                <span className={chipCountClass(category === cat.slug)}>{toPersianDigits(cat.post_count)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 of 3: results, in the house photo card. */}
      <section className={`${WIDE} pt-10 pb-20`}>
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PhotoCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && posts.length === 0 && (
          <div className={`rise mx-auto max-w-lg px-6 py-16 text-center sm:px-10 ${cardShell}`}>
            <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-300 text-ink-950">
              <SearchIcon className="h-6 w-6" />
            </span>
            <p className="mt-6 text-3xl font-black tracking-tight text-ink-950 dark:text-bone-50">نتیجه‌ای پیدا نشد</p>
            <p className="mt-3 leading-7 text-ink-600 dark:text-bone-300">
              {hasFilters
                ? 'با این جستجو یا فیلتر مقاله‌ای نداریم. عبارت دیگری را امتحان کنید یا فیلترها را بردارید.'
                : 'هنوز مقاله‌ای منتشر نشده است. به‌زودی سر بزنید.'}
            </p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className={`mt-7 ${solidPill}`}>
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="rise h-full"
                  style={{ '--rise-delay': `${index * 45}ms` } as React.CSSProperties}
                >
                  <PhotoCard post={post} eager={index === 0} />
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
