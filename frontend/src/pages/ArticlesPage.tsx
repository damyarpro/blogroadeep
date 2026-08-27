import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPosts, fetchCategories, ApiError } from '../lib/api';
import type { Category, PostSummary } from '../lib/types';
import { PostCard } from '../components/cards/PostCard';
import { PostGridSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { Seo } from '../components/seo/Seo';
import { useDebouncedValue } from '../lib/useDebouncedValue';

const DEFAULT_PAGE_SIZE = 12;

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

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Seo title="مقالات" description="فهرست مقالات بلاگ رودیپ همراه با امکان جستجو و فیلتر بر اساس دسته‌بندی." canonicalPath="/articles" />

      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">مقالات</h1>

      <div className="mb-6 flex flex-col gap-4">
        <label htmlFor="article-search" className="sr-only">
          جستجو در مقالات
        </label>
        <div className="relative max-w-md">
          <input
            id="article-search"
            type="search"
            placeholder="جستجو در مقالات…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pe-4 ps-10 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.8}
            stroke="currentColor"
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="فیلتر بر اساس دسته‌بندی">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                !category
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              همه
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  category === cat.slug
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {cat.name} ({cat.post_count})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <PostGridSkeleton />}

      {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!loading && !error && posts.length === 0 && (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">مقاله‌ای با این مشخصات یافت نشد.</p>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
