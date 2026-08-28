import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchCategories, ApiError } from '../lib/api';
import type { Category, PostSummary } from '../lib/types';
import { PostCard } from '../components/cards/PostCard';
import { CoverImage } from '../components/cards/CoverImage';
import { PostGridSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { formatJalaliDate, formatReadingTime } from '../lib/format';

/* Radius system for this page, applied everywhere:
   interactive (buttons, pills, chips) = full, surfaces (cards) = rounded-2xl. */

/** Newest post, given a split treatment so the eye has an obvious entry point. */
function LeadPost({ post }: { post: PostSummary }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <article className="lift group overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="grid md:grid-cols-5">
        {/* TODO: replace with real editorial photography for the lead slot (1200x900). */}
        <Link to={`/articles/${post.slug}`} className="block md:order-last md:col-span-2" tabIndex={-1} aria-hidden="true">
          <CoverImage src={post.cover_image} alt="" className="h-52 w-full md:h-full md:min-h-[20rem]" />
        </Link>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-10 md:col-span-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-indigo-600 px-2.5 py-1 font-medium text-white">تازه‌ترین</span>
            {post.category && (
              <Link
                to={`/articles?category=${post.category.slug}`}
                className="press rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {post.category.name}
              </Link>
            )}
          </div>

          <h3 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl dark:text-white">
            <Link
              to={`/articles/${post.slug}`}
              className="transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {post.title}
            </Link>
          </h3>

          <p className="line-clamp-3 leading-8 text-slate-600 dark:text-slate-400">{post.excerpt}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-500">
            <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
            {readingTime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readingTime}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPosts({ page: 1 })
      .then((data) => {
        if (!cancelled) setPosts(data.results.slice(0, 7));
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

  // Secondary content: a failure here must not take the page down with it.
  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [lead, ...rest] = posts ?? [];

  return (
    <>
      <Seo
        title="بلاگ رودیپ"
        description="بلاگ رودیپ؛ مقالات، یادداشت‌ها و تحلیل‌های تازه به زبان فارسی درباره فناوری، توسعه نرم‌افزار و ایده‌های نو."
        canonicalPath="/"
      />

      {/* Section 1 of 4 — asymmetric hero. Four text elements, nothing more. */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55rem_28rem_at_78%_-15%,var(--color-indigo-100),transparent_70%)] dark:bg-[radial-gradient(55rem_28rem_at_78%_-15%,var(--color-indigo-950),transparent_70%)]"
        />

        <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p
              className="rise mb-5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
              style={{ '--rise-delay': '0ms' } as React.CSSProperties}
            >
              نوشته‌های تازه، به زبان فارسی
            </p>

            <h1
              className="rise text-4xl font-extrabold leading-[1.25] text-slate-900 sm:text-5xl sm:leading-[1.2] dark:text-white"
              style={{ '--rise-delay': '60ms' } as React.CSSProperties}
            >
              جایی برای خواندن دربارهٔ{' '}
              <span className="bg-gradient-to-l from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-300">
                فناوری و ساختن
              </span>
            </h1>

            <p
              className="rise mt-6 max-w-xl text-lg leading-9 text-slate-600 dark:text-slate-400"
              style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            >
              مقاله‌ها و یادداشت‌هایی دربارهٔ توسعهٔ نرم‌افزار، طراحی و ابزارهای تازه، برای خوانندهٔ فارسی‌زبان.
            </p>
          </div>

          <div
            className="rise flex flex-wrap items-center gap-3 lg:col-span-4 lg:justify-end lg:pb-2"
            style={{ '--rise-delay': '180ms' } as React.CSSProperties}
          >
            <Link
              to="/articles"
              className="press rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-indigo-700"
            >
              خواندن مقالات
            </Link>
            <Link
              to="/categories"
              className="press rounded-full border border-slate-300 px-6 py-3 text-sm font-medium whitespace-nowrap text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
            >
              دسته‌بندی‌ها
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2 of 4 — split lead article. */}
      <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
        {loading && <PostGridSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && posts && posts.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400">هنوز مقاله‌ای منتشر نشده است.</p>
        )}

        {!loading && !error && lead && <LeadPost post={lead} />}
      </section>

      {/* Section 3 of 4 — card grid. */}
      {!loading && !error && rest.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">مقالات دیگر</h2>
            <Link
              to="/articles"
              className="text-sm font-medium whitespace-nowrap text-indigo-600 transition-colors duration-150 hover:text-indigo-700 hover:underline dark:text-indigo-400"
            >
              مشاهده همه
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <div
                key={post.id}
                className="rise"
                style={{ '--rise-delay': `${index * 50}ms` } as React.CSSProperties}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4 of 4 — pill strip, deliberately not another card grid. */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 sm:p-10 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">موضوع دلخواهتان را انتخاب کنید</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              نوشته‌ها بر اساس موضوع دسته‌بندی شده‌اند تا سریع‌تر به آنچه دنبالش هستید برسید.
            </p>

            <nav aria-label="دسته‌بندی‌ها" className="mt-7 flex flex-wrap gap-2.5">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/articles?category=${category.slug}`}
                  className="press rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors duration-150 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
                >
                  {category.name}
                  <span className="mr-2 text-xs text-slate-400 dark:text-slate-600">{category.post_count}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}
    </>
  );
}
