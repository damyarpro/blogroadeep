import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, ApiError } from '../lib/api';
import type { Category } from '../lib/types';
import { CoverImage } from '../components/cards/CoverImage';
import { PageHeader } from '../components/magazine/PageHeader';
import { ArrowIcon } from '../components/home/icons';
import { WIDE, arrowChipClass, cardShell, pillShell, solidPill } from '../components/magazine/tokens';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { toPersianDigits } from '../lib/format';

/* Magazine index of subjects: the same photo card the article grid uses, with
   the category's name where a headline would sit. */

function CategoryCard({ category, index }: { category: Category; index: number }) {
  return (
    <li className="rise" style={{ '--rise-delay': `${index * 55}ms` } as React.CSSProperties}>
      <article className={`group flex h-full flex-col overflow-hidden ${cardShell}`}>
        <Link
          to={`/articles?category=${category.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block overflow-hidden bg-ink-900"
        >
          <CoverImage
            src={null}
            alt=""
            seed={`category-${category.slug}`}
            photo="800/600"
            eager={index === 0}
            className="h-44 w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.04] sm:h-52"
          />
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <h2 className="text-2xl leading-snug font-black tracking-tight text-ink-950 dark:text-bone-50">
            <Link to={`/articles?category=${category.slug}`} className="hover:underline underline-offset-4">
              {category.name}
            </Link>
          </h2>

          {category.description && (
            <p className="line-clamp-2 text-sm leading-7 text-ink-600 dark:text-bone-300">{category.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <span className={`px-4 py-1.5 text-xs font-bold whitespace-nowrap text-ink-950 dark:text-bone-100 ${pillShell}`}>
              {toPersianDigits(category.post_count)} مقاله
            </span>
            <Link
              to={`/articles?category=${category.slug}`}
              aria-label={`مقاله‌های دستهٔ ${category.name}`}
              className={arrowChipClass}
            >
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}

function CardSkeleton() {
  return (
    <li aria-hidden="true" className={`overflow-hidden ${cardShell}`}>
      <div className="h-44 w-full animate-pulse bg-bone-300 sm:h-52 dark:bg-ink-800" />
      <div className="space-y-3 p-6">
        <div className="h-7 w-2/3 animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        <div className="h-4 w-full animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        </div>
      </div>
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
  const hasCategories = Boolean(categories && categories.length > 0);

  return (
    <>
      <Seo title="دسته‌بندی‌ها" description="فهرست کامل دسته‌بندی‌های بلاگ رودیپ." canonicalPath="/categories" />

      {/* Section 1 of 2: the shared centred display header. */}
      <PageHeader
        title="نوشته‌ها بر اساس موضوع"
        subtitle="یک دسته را انتخاب کنید تا فهرست مقاله‌های همان موضوع را ببینید."
      >
        {!loading && !error && hasCategories && categories && (
          <span className={`px-5 py-2.5 text-sm font-bold text-ink-950 dark:text-bone-100 ${pillShell}`}>
            {toPersianDigits(categories.length)} دسته‌بندی، در مجموع {toPersianDigits(total)} مقاله
          </span>
        )}
      </PageHeader>

      {/* Section 2 of 2: the subject cards. */}
      <section className={`${WIDE} pt-2 pb-20`}>
        {loading && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </ul>
        )}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && categories && categories.length === 0 && (
          <div className={`rise mx-auto max-w-lg px-6 py-16 text-center sm:px-10 ${cardShell}`}>
            <p className="text-3xl font-black tracking-tight text-ink-950 dark:text-bone-50">هنوز دسته‌بندی‌ای نداریم</p>
            <p className="mt-3 leading-7 text-ink-600 dark:text-bone-300">
              به‌جای آن می‌توانید همهٔ نوشته‌ها را در فهرست مقالات ببینید.
            </p>
            <Link to="/articles" className={`mt-7 ${solidPill}`}>
              رفتن به مقالات
            </Link>
          </div>
        )}

        {!loading && !error && hasCategories && categories && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, index) => (
              <CategoryCard key={cat.slug} category={cat} index={index} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
