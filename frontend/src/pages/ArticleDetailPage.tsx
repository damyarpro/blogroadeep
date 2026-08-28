import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPost, fetchPosts, ApiError } from '../lib/api';
import type { PostDetail, PostSummary } from '../lib/types';
import { formatJalaliDate, formatReadingTime } from '../lib/format';
import { CoverImage } from '../components/cards/CoverImage';
import { TagList } from '../components/cards/TagList';
import { ShareLinks } from '../components/cards/ShareLinks';
import { CommentSection } from '../components/cards/CommentSection';
import { ArticleSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo, SITE_NAME } from '../components/seo/Seo';

/* Radius system: surfaces = rounded-2xl, anything pressable = rounded-full. */

/**
 * Thin scroll-position bar. Written straight to the node's transform from a
 * rAF-throttled scroll handler, so reading never triggers a React render.
 */
function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]">
      <div ref={barRef} className="h-full origin-right bg-indigo-600 dark:bg-indigo-400" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}

/** Related items get list rows, not another card grid, so the eye reads them as a footnote. */
function RelatedRow({ post }: { post: PostSummary }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <li>
      <Link
        to={`/articles/${post.slug}`}
        className="press group flex items-center gap-4 rounded-full px-4 py-4 transition-colors duration-150 hover:bg-white dark:hover:bg-slate-900"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-slate-800 transition-colors duration-150 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
            {post.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400 dark:text-slate-500">
            <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
            {readingTime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readingTime}</span>
              </>
            )}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-slate-300 transition-colors duration-150 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-indigo-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
        </svg>
      </Link>
    </li>
  );
}

export function ArticleDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [related, setRelated] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setPost(null);

    fetchPost(slug)
      .then((data) => {
        if (cancelled) return;
        setPost(data);
        if (data.category) {
          fetchPosts({ category: data.category.slug })
            .then((res) => {
              if (!cancelled) {
                setRelated(res.results.filter((p) => p.slug !== data.slug).slice(0, 3));
              }
            })
            .catch(() => {
              /* related posts are a bonus, ignore failures */
            });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof ApiError ? err.message : 'خطای غیرمنتظره‌ای رخ داد.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  if (loading) return <ArticleSkeleton />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Seo title="مقاله یافت نشد" noIndex canonicalPath={`/articles/${slug}`} />
        <h1 className="rise text-2xl font-bold text-slate-900 dark:text-white">مقاله یافت نشد</h1>
        <p
          className="rise mt-3 leading-8 text-slate-500 dark:text-slate-400"
          style={{ '--rise-delay': '60ms' } as React.CSSProperties}
        >
          مقاله‌ای با این نشانی وجود ندارد یا حذف شده است.
        </p>
        <Link
          to="/articles"
          className="press rise mt-8 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-indigo-700"
          style={{ '--rise-delay': '120ms' } as React.CSSProperties}
        >
          بازگشت به فهرست مقالات
        </Link>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState message={error ?? undefined} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    );
  }

  const readingTime = formatReadingTime(post.reading_time);
  const canonicalPath = `/articles/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author.full_name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    ...(post.cover_image ? { image: post.cover_image } : {}),
  };

  return (
    <>
      <Seo
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        canonicalPath={canonicalPath}
        image={post.cover_image}
        type="article"
        keywords={post.meta_keywords}
        jsonLd={jsonLd}
      />
      <ReadingProgress />

      <article>
        {/* Section 1: title band, a centred column with a soft wash behind it. */}
        <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45rem_22rem_at_80%_-30%,var(--color-indigo-100),transparent_70%)] dark:bg-[radial-gradient(45rem_22rem_at_80%_-30%,var(--color-indigo-950),transparent_70%)]"
          />

          <div className="mx-auto max-w-3xl px-4 pt-10 pb-14 sm:px-6">
            <nav aria-label="مسیر جاری" className="rise text-sm text-slate-500 dark:text-slate-400">
              <Link to="/" className="transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400">
                خانه
              </Link>
              <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
              <Link to="/articles" className="transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400">
                مقالات
              </Link>
              {post.category && (
                <>
                  <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
                  <Link
                    to={`/articles?category=${post.category.slug}`}
                    className="transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
            </nav>

            {post.category && (
              <Link
                to={`/articles?category=${post.category.slug}`}
                className="press rise mt-6 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition-colors duration-150 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                style={{ '--rise-delay': '40ms' } as React.CSSProperties}
              >
                {post.category.name}
              </Link>
            )}

            <h1
              className="rise mt-4 text-3xl font-extrabold leading-[1.3] text-slate-900 sm:text-[2.6rem] sm:leading-[1.25] dark:text-white"
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}
            >
              {post.title}
            </h1>

            <div
              className="rise mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400"
              style={{ '--rise-delay': '140ms' } as React.CSSProperties}
            >
              <span className="font-medium text-slate-700 dark:text-slate-300">{post.author.full_name}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
              {readingTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{readingTime}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Section 2: the read itself; the cover breaks the band above it. */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <CoverImage
            src={post.cover_image}
            alt={post.title}
            className="relative -mt-8 h-60 w-full rounded-2xl ring-1 ring-slate-200 sm:h-80 dark:ring-slate-800"
          />

          <div
            className="prose-fa mt-12 max-w-none text-[17px] leading-8 text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 flex flex-col gap-5 border-t border-slate-200 pt-8 dark:border-slate-800">
            <TagList tags={post.tags} />
            <ShareLinks url={typeof window !== 'undefined' ? window.location.href : canonicalPath} title={post.title} />
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
        <CommentSection slug={post.slug} comments={post.comments ?? []} />
      </div>

      {/* Section 3: a quiet full-width strip, on purpose unlike the article column. */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="mt-16 border-t border-slate-200 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-4 flex items-baseline justify-between gap-4 px-4">
              <h2 id="related-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                در همین دسته
              </h2>
              {post.category && (
                <Link
                  to={`/articles?category=${post.category.slug}`}
                  className="text-sm font-medium whitespace-nowrap text-indigo-600 transition-colors duration-150 hover:text-indigo-700 hover:underline dark:text-indigo-400"
                >
                  مشاهده همه
                </Link>
              )}
            </div>

            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {related.map((item) => (
                <RelatedRow key={item.id} post={item} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
