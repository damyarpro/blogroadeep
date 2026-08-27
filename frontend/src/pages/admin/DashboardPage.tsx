import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, fetchAdminStats } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatJalaliDateTime, toPersianDigits } from '../../lib/format';
import type { AdminStats } from '../../lib/types';
import { card, primaryButton, secondaryButton, statusBadge } from '../../components/admin/panelStyles';
import { Seo } from '../../components/seo/Seo';

function StatCard({
  title,
  value,
  caption,
  tone,
}: {
  title: string;
  value: number;
  caption: string;
  tone: string;
}) {
  return (
    <div className={card}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${tone}`}>
        {toPersianDigits(value)}
      </p>
      <p className="mt-1 text-xs text-slate-400">{caption}</p>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'دریافت آمار با خطا مواجه شد.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <Seo title="داشبورد پنل" noIndex />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            سلام {user?.full_name ?? user?.username} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            وضعیت کلی وبلاگ در یک نگاه.
          </p>
        </div>
        <Link to="/admin/posts/new" className={primaryButton}>
          نوشتن مقالهٔ تازه
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">در حال بارگذاری…</p>}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {stats && (
        <>
          {stats.comments.pending > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {toPersianDigits(stats.comments.pending)} دیدگاه در انتظار تأیید است.
              </p>
              <Link to="/admin/comments" className={`${secondaryButton} text-xs`}>
                بررسی دیدگاه‌ها
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="نوشته‌های منتشرشده"
              value={stats.posts.published}
              caption={`از مجموع ${toPersianDigits(stats.posts.total)} نوشته`}
              tone="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="پیش‌نویس‌ها"
              value={stats.posts.draft}
              caption="آمادهٔ ویرایش و انتشار"
              tone="text-amber-600 dark:text-amber-400"
            />
            <StatCard
              title="دیدگاه‌های در انتظار"
              value={stats.comments.pending}
              caption={`${toPersianDigits(stats.comments.approved)} دیدگاه تأییدشده`}
              tone="text-rose-600 dark:text-rose-400"
            />
            <StatCard
              title="دسته‌ها و برچسب‌ها"
              value={stats.taxonomy.categories + stats.taxonomy.tags}
              caption={`${toPersianDigits(stats.taxonomy.categories)} دسته · ${toPersianDigits(stats.taxonomy.tags)} برچسب`}
              tone="text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <section className={card}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">آخرین نوشته‌ها</h2>
              <Link
                to="/admin/posts"
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                مشاهدهٔ همه
              </Link>
            </div>

            {stats.recent_posts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                هنوز نوشته‌ای ثبت نشده است.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recent_posts.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Link
                      to={`/admin/posts/${item.id}/edit`}
                      className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
                    >
                      {item.title}
                    </Link>
                    <span className={statusBadge(item.is_published)}>
                      {item.is_published ? 'منتشرشده' : 'پیش‌نویس'}
                    </span>
                    <time className="text-xs text-slate-400" dateTime={item.created_at}>
                      {formatJalaliDateTime(item.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
