import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, ApiError } from '../lib/api';
import type { Category } from '../lib/types';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { toPersianDigits } from '../lib/format';

/* Radius system: surfaces = rounded-2xl, anything pressable = rounded-full. */

function CategoryRowSkeleton() {
  return (
    <li className="flex items-center gap-5 px-5 py-7 sm:px-8" aria-hidden="true">
      <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </li>
  );
}

function CategoryRow({ category, index }: { category: Category; index: number }) {
  return (
    <li className="rise" style={{ '--rise-delay': `${index * 55}ms` } as React.CSSProperties}>
      <Link
        to={`/articles?category=${category.slug}`}
        className="press group flex items-start gap-5 px-5 py-7 transition-colors duration-150 hover:bg-slate-50 sm:px-8 dark:hover:bg-slate-900/60"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 text-sm font-medium text-slate-300 tabular-nums transition-colors duration-150 group-hover:text-indigo-500 dark:text-slate-700"
        >
          {toPersianDigits(index + 1)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-bold text-slate-900 transition-colors duration-150 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
              {category.name}
            </span>
            <span className="text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
              {toPersianDigits(category.post_count)} مقاله
            </span>
          </span>

          {category.description && (
            <span className="mt-2 block max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              {category.description}
            </span>
          )}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
          className="mt-1.5 h-4 w-4 shrink-0 text-slate-300 transition-colors duration-150 group-hover:text-indigo-600 dark:text-slate-700 dark:group-hover:text-indigo-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
        </svg>
      </Link>
    </li>
  );
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

  const total = categories?.reduce((sum, cat) => sum + cat.post_count, 0) ?? 0;

  return (
    <>
      <Seo title="دسته‌بندی‌ها" description="فهرست کامل دسته‌بندی‌های بلاگ رودیپ." canonicalPath="/categories" />

      {/* Section 1 of 2: narrow intro column, offset from the list below it. */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-10 sm:px-6">
        <div className="max-w-xl">
          <h1 className="rise text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl dark:text-white">
            دسته‌بندی‌ها
          </h1>
          <p
            className="rise mt-4 leading-8 text-slate-600 dark:text-slate-400"
            style={{ '--rise-delay': '60ms' } as React.CSSProperties}
          >
            نوشته‌ها بر اساس موضوع مرتب شده‌اند. یکی را انتخاب کنید تا فهرست مقاله‌های همان موضوع را ببینید.
          </p>
          {!loading && !error && categories && categories.length > 0 && (
            <p
              className="rise mt-4 text-sm text-slate-400 dark:text-slate-500"
              style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            >
              {toPersianDigits(categories.length)} دسته‌بندی، در مجموع {toPersianDigits(total)} مقاله
            </p>
          )}
        </div>
      </section>

      {/* Section 2 of 2: one generous list surface, not a card grid. */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {loading && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategoryRowSkeleton key={i} />
            ))}
          </ul>
        )}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && categories && categories.length === 0 && (
          <div className="rise mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
            <p className="text-lg font-bold text-slate-900 dark:text-white">هنوز دسته‌بندی‌ای نداریم</p>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              به‌جای آن می‌توانید همهٔ نوشته‌ها را در فهرست مقالات ببینید.
            </p>
            <Link
              to="/articles"
              className="press mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-indigo-700"
            >
              رفتن به مقالات
            </Link>
          </div>
        )}

        {!loading && !error && categories && categories.length > 0 && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {categories.map((cat, index) => (
              <CategoryRow key={cat.slug} category={cat} index={index} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
