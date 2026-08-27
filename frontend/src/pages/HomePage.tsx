import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, ApiError } from '../lib/api';
import type { PostSummary } from '../lib/types';
import { PostCard } from '../components/cards/PostCard';
import { PostGridSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPosts({ page: 1 })
      .then((data) => {
        if (!cancelled) setPosts(data.results.slice(0, 6));
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
    <>
      <Seo
        title="بلاگ رودیپ"
        description="بلاگ رودیپ؛ مقالات، یادداشت‌ها و تحلیل‌های تازه به زبان فارسی درباره فناوری، توسعه نرم‌افزار و ایده‌های نو."
        canonicalPath="/"
      />

      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/70 to-white dark:border-slate-800 dark:from-indigo-950/20 dark:to-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl dark:text-white">
            به بلاگ رودیپ خوش آمدید
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-400">
            جایی برای خواندن مقالات، یادداشت‌ها و تحلیل‌های تازه درباره فناوری، طراحی و دنیای نرم‌افزار؛
            نوشته‌شده به زبان فارسی و برای مخاطب فارسی‌زبان.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/articles"
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              مشاهده همه مقالات
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">تازه‌ترین مقالات</h2>
          <Link to="/articles" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            مشاهده همه ←
          </Link>
        </div>

        {loading && <PostGridSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && posts && posts.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400">هنوز مقاله‌ای منتشر نشده است.</p>
        )}

        {!loading && !error && posts && posts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
