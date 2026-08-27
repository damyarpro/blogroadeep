import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPost, fetchPosts, ApiError } from '../lib/api';
import type { PostDetail, PostSummary } from '../lib/types';
import { formatJalaliDate, formatReadingTime } from '../lib/format';
import { CoverImage } from '../components/cards/CoverImage';
import { TagList } from '../components/cards/TagList';
import { ShareLinks } from '../components/cards/ShareLinks';
import { CommentSection } from '../components/cards/CommentSection';
import { PostCard } from '../components/cards/PostCard';
import { ArticleSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo, SITE_NAME } from '../components/seo/Seo';

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
              /* related posts are a bonus — ignore failures */
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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Seo title="مقاله یافت نشد" noIndex canonicalPath={`/articles/${slug}`} />
        <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">مقاله یافت نشد</h1>
        <p className="mb-6 text-slate-500 dark:text-slate-400">
          مقاله‌ای با این نشانی وجود ندارد یا حذف شده است.
        </p>
        <Link to="/articles" className="text-indigo-600 hover:underline dark:text-indigo-400">
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
    dateModified: post.published_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    ...(post.cover_image ? { image: post.cover_image } : {}),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Seo
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        canonicalPath={canonicalPath}
        image={post.cover_image}
        type="article"
        keywords={post.meta_keywords}
        jsonLd={jsonLd}
      />

      <nav aria-label="مسیر جاری" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          خانه
        </Link>
        <span className="mx-2">/</span>
        <Link to="/articles" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          مقالات
        </Link>
        {post.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              to={`/articles?category=${post.category.slug}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {post.category.name}
            </Link>
          </>
        )}
      </nav>

      <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl dark:text-white">
        {post.title}
      </h1>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
        <span>{post.author_name}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
        {readingTime && (
          <>
            <span aria-hidden="true">·</span>
            <span>{readingTime}</span>
          </>
        )}
      </div>

      <CoverImage src={post.cover_image} alt={post.title} className="mb-8 h-72 w-full rounded-2xl sm:h-96" />

      <div
        className="prose-fa max-w-none text-[17px] leading-8 text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
        <TagList tags={post.tags} />
        <ShareLinks url={typeof window !== 'undefined' ? window.location.href : canonicalPath} title={post.title} />
      </div>

      <CommentSection slug={post.slug} comments={post.comments ?? []} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            مقالات مرتبط
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
