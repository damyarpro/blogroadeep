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

/* Radius system: block surfaces = rounded-3xl, inset media = rounded-2xl,
   anything pressable = rounded-full. */

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
      <div ref={barRef} className="h-full origin-right bg-forest-800 dark:bg-mint-300" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}

/** Related items get list rows on a solid block, not another tile grid. */
function RelatedRow({ post }: { post: PostSummary }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <li>
      <Link
        to={`/articles/${post.slug}`}
        className="press group flex items-center gap-4 rounded-full px-5 py-5 transition-colors duration-150 hover:bg-ink-900 dark:hover:bg-ink-800"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold tracking-tight text-bone-50 transition-colors duration-150 group-hover:text-mint-300">
            {post.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-bone-400">
            <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
            {readingTime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readingTime}</span>
              </>
            )}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-800 text-bone-100 transition-colors duration-150 group-hover:bg-mint-300 group-hover:text-ink-950 dark:bg-ink-700"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6-6m-6 6 6 6" />
          </svg>
        </span>
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
        <h1 className="rise text-3xl font-black tracking-tight text-ink-950 dark:text-bone-50">مقاله یافت نشد</h1>
        <p
          className="rise mt-4 leading-8 text-ink-600 dark:text-bone-300"
          style={{ '--rise-delay': '60ms' } as React.CSSProperties}
        >
          مقاله‌ای با این نشانی وجود ندارد یا حذف شده است.
        </p>
        <Link
          to="/articles"
          className="press rise mt-8 inline-block rounded-full bg-mint-300 px-7 py-3 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-400"
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
        {/* Section 1: the title band is an ink board with the cover framed inside it. */}
        <header className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <div className="rounded-[2rem] bg-ink-950 p-6 sm:p-10 lg:p-12 dark:bg-ink-900">
            <nav aria-label="مسیر جاری" className="rise text-sm text-bone-400">
              <Link to="/" className="transition-colors duration-150 hover:text-mint-300">
                خانه
              </Link>
              <span className="mx-2 text-ink-700 dark:text-ink-800">/</span>
              <Link to="/articles" className="transition-colors duration-150 hover:text-mint-300">
                مقالات
              </Link>
              {post.category && (
                <>
                  <span className="mx-2 text-ink-700 dark:text-ink-800">/</span>
                  <Link
                    to={`/articles?category=${post.category.slug}`}
                    className="transition-colors duration-150 hover:text-mint-300"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-8 grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                {post.category && (
                  <Link
                    to={`/articles?category=${post.category.slug}`}
                    className="press rise inline-block rounded-full bg-mint-300 px-4 py-1.5 text-xs font-bold text-ink-950 transition-colors duration-150 hover:bg-mint-400"
                    style={{ '--rise-delay': '40ms' } as React.CSSProperties}
                  >
                    {post.category.name}
                  </Link>
                )}

                <h1
                  className="rise mt-5 text-[2.35rem] leading-[1.15] font-black tracking-tight text-bone-50 sm:text-5xl sm:leading-[1.1]"
                  style={{ '--rise-delay': '80ms' } as React.CSSProperties}
                >
                  {post.title}
                </h1>

                <div
                  className="rise mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-bone-400"
                  style={{ '--rise-delay': '140ms' } as React.CSSProperties}
                >
                  <span className="font-bold text-bone-100">{post.author.full_name}</span>
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

              <div
                className="rise lg:col-span-5"
                style={{ '--rise-delay': '200ms' } as React.CSSProperties}
                aria-hidden="true"
              >
                <div className="rounded-3xl bg-ink-900 p-2 dark:bg-ink-950">
                  <CoverImage
                    src={post.cover_image}
                    alt=""
                    seed={post.slug}
                    className="h-52 w-full rounded-2xl sm:h-64"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Section 2: the read itself, on a bone board so the column feels like paper. */}
        <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
          <div className="rounded-[2rem] border border-bone-300 bg-bone-50 px-5 py-10 sm:px-10 sm:py-14 dark:border-ink-700 dark:bg-ink-900">
            <div className="mx-auto max-w-2xl">
              <div
                className="prose-fa max-w-none text-[17px] leading-8 text-ink-700 dark:text-bone-200"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-12 flex flex-col gap-5 border-t border-bone-300 pt-8 dark:border-ink-800">
                <TagList tags={post.tags} />
                <ShareLinks url={typeof window !== 'undefined' ? window.location.href : canonicalPath} title={post.title} />
              </div>
            </div>
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <CommentSection slug={post.slug} comments={post.comments ?? []} />
        </div>
      </div>

      {/* Section 3: a solid charcoal strip, on purpose unlike the article column. */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mx-auto max-w-5xl px-4 pt-10 pb-20 sm:px-6">
          <div className="rounded-[2rem] bg-ink-950 p-5 sm:p-8 dark:bg-ink-900">
            <div className="mb-3 flex items-baseline justify-between gap-4 px-5">
              <h2 id="related-heading" className="text-2xl font-black tracking-tight text-bone-50">
                در همین دسته
              </h2>
              {post.category && (
                <Link
                  to={`/articles?category=${post.category.slug}`}
                  className="press text-sm font-bold whitespace-nowrap text-mint-300 transition-colors duration-150 hover:text-mint-200"
                >
                  مشاهده همه
                </Link>
              )}
            </div>

            <ul className="divide-y divide-ink-800 dark:divide-ink-700">
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
