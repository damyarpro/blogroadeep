import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPost, fetchPosts, ApiError } from '../lib/api';
import type { PostDetail, PostSummary } from '../lib/types';
import { CoverImage } from '../components/cards/CoverImage';
import { TagList } from '../components/cards/TagList';
import { ShareLinks } from '../components/cards/ShareLinks';
import { CommentSection } from '../components/cards/CommentSection';
import { AuthorRow } from '../components/magazine/Meta';
import { SectionBar } from '../components/magazine/SectionBar';
import { ThumbRow } from '../components/magazine/ThumbRow';
import { NARROW, cardShell, mintPill, pillShell } from '../components/magazine/tokens';
import { ArticleSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo, SITE_NAME } from '../components/seo/Seo';

/* Magazine article: a centred header on the accent wash, the cover framed
   full-width beneath it, then the read itself on one white card. */

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
      <div ref={barRef} className="h-full origin-right bg-ink-950 dark:bg-mint-300" style={{ transform: 'scaleX(0)' }} />
    </div>
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
          className={`rise mt-8 ${mintPill}`}
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
        {/* Section 1 of 3: centred header on the accent wash. */}
        <header className="hero-wash">
          <div className={`${NARROW} pt-10 pb-9 text-center sm:pt-14`}>
            <nav aria-label="مسیر جاری" className="rise text-xs text-ink-600 dark:text-bone-400">
              <Link to="/" className="transition-colors duration-150 hover:text-ink-950 dark:hover:text-mint-300">
                خانه
              </Link>
              <span aria-hidden="true" className="mx-2 text-ink-400">
                /
              </span>
              <Link to="/articles" className="transition-colors duration-150 hover:text-ink-950 dark:hover:text-mint-300">
                مقالات
              </Link>
            </nav>

            {post.category && (
              <Link
                to={`/articles?category=${post.category.slug}`}
                className={`press rise mt-6 inline-block px-5 py-2 text-xs font-bold text-ink-950 hover:border-ink-950 dark:text-bone-100 dark:hover:border-mint-300 ${pillShell}`}
                style={{ '--rise-delay': '40ms' } as React.CSSProperties}
              >
                {post.category.name}
              </Link>
            )}

            <h1
              className="rise mx-auto mt-6 max-w-3xl text-[2.1rem] leading-[1.15] font-black tracking-tight text-ink-950 sm:text-[2.9rem] sm:leading-[1.1] dark:text-bone-50"
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}
            >
              {post.title}
            </h1>

            <AuthorRow
              post={post}
              className="rise mt-7 justify-center text-ink-600 dark:text-bone-300"
            />
          </div>
        </header>

        {/* Section 2 of 3: the cover, then the read on one white card. */}
        <div className={NARROW}>
          <div aria-hidden="true" className="overflow-hidden rounded-3xl bg-ink-900">
            <CoverImage
              src={post.cover_image}
              alt=""
              seed={post.slug}
              photo="1600/900"
              eager
              className="h-56 w-full sm:h-80 lg:h-[26rem]"
            />
          </div>

          <div className={`mt-5 px-5 py-10 sm:px-10 sm:py-14 ${cardShell}`}>
            <div className="mx-auto max-w-2xl">
              <div
                className="prose-fa max-w-none text-[17px] leading-8 text-ink-700 dark:text-bone-200"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-12 flex flex-col gap-6 border-t border-bone-300 pt-8 dark:border-ink-800">
                <TagList tags={post.tags} />
                <ShareLinks url={typeof window !== 'undefined' ? window.location.href : canonicalPath} title={post.title} />
              </div>
            </div>
          </div>
        </div>
      </article>

      <div className={`${NARROW} pb-6`}>
        <div className="mx-auto max-w-2xl">
          <CommentSection slug={post.slug} comments={post.comments ?? []} />
        </div>
      </div>

      {/* Section 3 of 3: related reads, in the home bento's thumbnail rows. */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className={`${NARROW} pt-10 pb-20`}>
          {/* Kept on the reading measure so the page's lower half stays on one
              axis, and each row matches the home bento's side column. */}
          <div className="mx-auto max-w-2xl">
            <SectionBar
              id="related-heading"
              title="در همین دسته"
              action={post.category ? { to: `/articles?category=${post.category.slug}`, label: 'مشاهدهٔ همه' } : undefined}
            />

            <div className="mt-4 grid gap-4">
              {related.map((item) => (
                <ThumbRow key={item.id} post={item} mediaClass="h-full min-h-40" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
