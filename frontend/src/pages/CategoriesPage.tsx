import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, ApiError } from '../lib/api';
import type { Category } from '../lib/types';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';

function CategoryCardSkeleton() {
  return <div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" aria-hidden="true" />;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
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
  }, [reloadKey]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Seo title="دسته‌بندی‌ها" description="فهرست کامل دسته‌بندی‌های بلاگ رودیپ." canonicalPath="/categories" />

      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">دسته‌بندی‌ها</h1>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!loading && !error && categories && categories.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400">دسته‌بندی‌ای ثبت نشده است.</p>
      )}

      {!loading && !error && categories && categories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/articles?category=${cat.slug}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-700"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {cat.post_count} مقاله
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
