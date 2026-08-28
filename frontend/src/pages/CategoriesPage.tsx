import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, ApiError } from '../lib/api';
import type { Category } from '../lib/types';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { toPersianDigits } from '../lib/format';
import { CoverArt } from '../components/cards/CoverArt';

/* Radius system: block surfaces = rounded-3xl, anything pressable = rounded-full. */

type TileTone = 'ink' | 'mint' | 'bone';

/** Bento rhythm: the first tile is wide and charcoal, then mint and bone alternate. */
function toneFor(index: number): TileTone {
  if (index === 0) return 'ink';
  return index % 3 === 2 ? 'mint' : 'bone';
}

const tileShell: Record<TileTone, string> = {
  ink: 'bg-ink-950 dark:bg-ink-800',
  mint: 'bg-mint-300',
  bone: 'border border-bone-300 bg-bone-50 dark:border-ink-700 dark:bg-ink-900',
};

const tileTitle: Record<TileTone, string> = {
  ink: 'text-bone-50',
  mint: 'text-ink-950',
  bone: 'text-ink-950 dark:text-bone-50',
};

const tileBody: Record<TileTone, string> = {
  ink: 'text-bone-300',
  mint: 'text-forest-900',
  bone: 'text-ink-600 dark:text-bone-300',
};

const tileCount: Record<TileTone, string> = {
  ink: 'bg-ink-800 text-bone-100',
  mint: 'bg-ink-950 text-mint-300',
  bone: 'bg-bone-200 text-ink-950 dark:bg-ink-800 dark:text-bone-100',
};

const tileArrow: Record<TileTone, string> = {
  ink: 'bg-mint-300 text-ink-950 group-hover:bg-mint-400',
  mint: 'bg-ink-950 text-mint-300 group-hover:bg-forest-900',
  bone: 'bg-ink-950 text-bone-50 group-hover:bg-forest-800 dark:bg-mint-300 dark:text-ink-950 dark:group-hover:bg-mint-400',
};

function CategoryTile({ category, index }: { category: Category; index: number }) {
  const tone = toneFor(index);

  return (
    <li
      className={`rise ${index === 0 ? 'sm:col-span-2' : ''}`}
      style={{ '--rise-delay': `${index * 55}ms` } as React.CSSProperties}
    >
      <Link
        to={`/articles?category=${category.slug}`}
        className={`lift press group flex h-full flex-col gap-5 rounded-3xl p-8 sm:p-10 ${tileShell[tone]}`}
      >
        <span className="flex items-start justify-between gap-4">
          <span className={`text-3xl leading-snug font-black tracking-tight ${tileTitle[tone]}`}>{category.name}</span>
          <span
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${tileArrow[tone]}`}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6-6m-6 6 6 6" />
            </svg>
          </span>
        </span>

        {category.description && (
          <span className={`max-w-md leading-7 ${tileBody[tone]}`}>{category.description}</span>
        )}

        {index === 0 && (
          <span aria-hidden="true" className="mt-2 block rounded-3xl bg-ink-900 p-2">
            <CoverArt seed={`category-${category.slug}`} className="block h-40 w-full rounded-2xl sm:h-48" />
          </span>
        )}

        <span
          className={`mt-auto w-fit rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap ${tileCount[tone]}`}
        >
          {toPersianDigits(category.post_count)} مقاله
        </span>
      </Link>
    </li>
  );
}

function TileSkeleton({ wide }: { wide?: boolean }) {
  return (
    <li
      aria-hidden="true"
      className={`h-52 animate-pulse rounded-3xl bg-bone-200 dark:bg-ink-800 ${wide ? 'sm:col-span-2' : ''}`}
    />
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

      {/* Section 1 of 2: narrow intro column on bare paper. */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-10 sm:px-6">
        <div className="max-w-xl">
          <h1 className="rise text-[2.75rem] leading-[1.1] font-black tracking-tight text-ink-950 sm:text-6xl dark:text-bone-50">
            دسته‌بندی‌ها
          </h1>
          <p
            className="rise mt-5 leading-8 text-ink-600 dark:text-bone-300"
            style={{ '--rise-delay': '60ms' } as React.CSSProperties}
          >
            نوشته‌ها بر اساس موضوع مرتب شده‌اند. یکی را انتخاب کنید تا فهرست مقاله‌های همان موضوع را ببینید.
          </p>
          {!loading && !error && categories && categories.length > 0 && (
            <p
              className="rise mt-6"
              style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            >
              <span className="inline-block rounded-full bg-bone-200 px-4 py-2 text-sm font-bold text-ink-950 dark:bg-ink-800 dark:text-bone-100">
                {toPersianDigits(categories.length)} دسته‌بندی، در مجموع {toPersianDigits(total)} مقاله
              </span>
            </p>
          )}
        </div>
      </section>

      {/* Section 2 of 2: bento tiles of mixed size and fill, not the article grid. */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {loading && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <TileSkeleton key={i} wide={i === 0} />
            ))}
          </ul>
        )}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && categories && categories.length === 0 && (
          <div className="rise mx-auto max-w-lg rounded-[2rem] bg-mint-300 px-6 py-16 text-center sm:px-10">
            <p className="text-3xl font-black tracking-tight text-ink-950">هنوز دسته‌بندی‌ای نداریم</p>
            <p className="mt-3 leading-7 text-forest-900">
              به‌جای آن می‌توانید همهٔ نوشته‌ها را در فهرست مقالات ببینید.
            </p>
            <Link
              to="/articles"
              className="press mt-7 inline-block rounded-full bg-ink-950 px-7 py-3 text-sm font-bold whitespace-nowrap text-bone-50 transition-colors duration-150 hover:bg-forest-900"
            >
              رفتن به مقالات
            </Link>
          </div>
        )}

        {!loading && !error && categories && categories.length > 0 && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {categories.map((cat, index) => (
              <CategoryTile key={cat.slug} category={cat} index={index} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
