import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchCategories, ApiError } from '../lib/api';
import type { Category, PostSummary } from '../lib/types';
import { PostCard } from '../components/cards/PostCard';
import { CoverImage } from '../components/cards/CoverImage';
import { PostGridSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { formatJalaliDate, formatReadingTime, toPersianDigits } from '../lib/format';

/* Radius system: block surfaces = rounded-3xl, inset media = rounded-2xl,
   anything pressable = rounded-full. Palette: bone paper, ink type, mint accent. */

/** Newest post, given a solid charcoal treatment so the eye has an obvious entry point. */
function LeadPost({ post }: { post: PostSummary }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <article className="overflow-hidden rounded-3xl bg-ink-950 dark:bg-ink-900">
      <div className="grid md:grid-cols-5">
        {/* TODO: replace with real editorial photography for the lead slot (1200x900). */}
        <div className="p-3 md:order-last md:col-span-2 md:ps-0">
          <Link to={`/articles/${post.slug}`} className="block h-full" tabIndex={-1} aria-hidden="true">
            <CoverImage src={post.cover_image} alt="" className="h-52 w-full rounded-2xl md:h-full md:min-h-[19rem]" />
          </Link>
        </div>

        <div className="flex flex-col justify-center gap-5 p-6 sm:p-9 md:col-span-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-mint-300 px-3 py-1 font-bold text-ink-950">تازه‌ترین</span>
            {post.category && (
              <Link
                to={`/articles?category=${post.category.slug}`}
                className="press rounded-full border border-bone-400 px-3 py-1 font-bold text-bone-100 transition-colors duration-150 hover:border-mint-300 hover:bg-mint-300 hover:text-ink-950"
              >
                {post.category.name}
              </Link>
            )}
          </div>

          <h3 className="text-2xl leading-[1.25] font-black tracking-tight text-bone-50 sm:text-4xl">
            <Link to={`/articles/${post.slug}`}>{post.title}</Link>
          </h3>

          <p className="line-clamp-3 leading-8 text-bone-300">{post.excerpt}</p>

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-bone-400">
            <span className="flex flex-wrap items-center gap-x-3">
              <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
              {readingTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{readingTime}</span>
                </>
              )}
            </span>

            <Link
              to={`/articles/${post.slug}`}
              className="press inline-flex items-center gap-2 rounded-full bg-mint-300 py-2 ps-5 pe-2 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-400"
            >
              خواندن مقاله
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-mint-300">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6-6m-6 6 6 6" />
                </svg>
              </span>
            </Link>
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

      {/* Section 1 of 4: asymmetric hero. Four text elements, nothing more. */}
      <section className="border-b border-bone-300 dark:border-ink-800">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p
              className="rise mb-5 text-sm font-bold text-forest-800 dark:text-mint-300"
              style={{ '--rise-delay': '0ms' } as React.CSSProperties}
            >
              نوشته‌های تازه، به زبان فارسی
            </p>

            <h1
              className="rise text-4xl leading-[1.25] font-black tracking-tight text-ink-950 sm:text-6xl sm:leading-[1.15] dark:text-bone-50"
              style={{ '--rise-delay': '60ms' } as React.CSSProperties}
            >
              جایی برای خواندن دربارهٔ <span className="highlight-mint">فناوری و ساختن</span>
            </h1>

            <p
              className="rise mt-7 max-w-xl text-lg leading-9 text-ink-600 dark:text-bone-300"
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
              className="press rounded-full bg-mint-300 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-400"
            >
              خواندن مقالات
            </Link>
            <Link
              to="/categories"
              className="press rounded-full border border-ink-950 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950"
            >
              دسته‌بندی‌ها
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2 of 4: split lead article on a solid charcoal block. */}
      <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
        {loading && <PostGridSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && posts && posts.length === 0 && (
          <p className="text-center text-ink-600 dark:text-bone-300">هنوز مقاله‌ای منتشر نشده است.</p>
        )}

        {!loading && !error && lead && <LeadPost post={lead} />}
      </section>

      {/* Section 3 of 4: tile grid with one mint tile breaking the rhythm. */}
      {!loading && !error && rest.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight text-ink-950 dark:text-bone-50">مقالات دیگر</h2>
            <Link
              to="/articles"
              className="press rounded-full border border-ink-950 px-5 py-2 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950"
            >
              مشاهده همه
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <div key={post.id} className="rise" style={{ '--rise-delay': `${index * 50}ms` } as React.CSSProperties}>
                <PostCard post={post} tone={index === 1 ? 'mint' : 'bone'} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4 of 4: pill strip on a bone block, deliberately not another tile grid. */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-bone-300 bg-bone-50 p-8 sm:p-12 dark:border-ink-700 dark:bg-ink-900">
            <h2 className="max-w-lg text-2xl leading-snug font-black tracking-tight text-ink-950 sm:text-3xl dark:text-bone-50">
              موضوع دلخواهتان را انتخاب کنید
            </h2>
            <p className="mt-3 max-w-lg leading-8 text-ink-600 dark:text-bone-300">
              نوشته‌ها بر اساس موضوع دسته‌بندی شده‌اند تا سریع‌تر به آنچه دنبالش هستید برسید.
            </p>

            <nav aria-label="دسته‌بندی‌ها" className="mt-8 flex flex-wrap gap-2.5">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/articles?category=${category.slug}`}
                  className="press rounded-full bg-bone-200 px-5 py-2.5 text-sm font-bold text-ink-950 transition-colors duration-150 hover:bg-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950"
                >
                  {category.name}
                  <span className="ms-2 font-normal opacity-60">{toPersianDigits(category.post_count)}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}
    </>
  );
}
