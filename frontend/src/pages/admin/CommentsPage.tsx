import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  bulkApproveComments,
  deleteAdminComment,
  fetchAdminComments,
  setCommentApproval,
} from '../../lib/api';
import type { AdminComment } from '../../lib/types';
import { formatJalaliDateTime, toPersianDigits } from '../../lib/format';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../components/admin/Toaster';
import { card, dangerButton, primaryButton, secondaryButton } from '../../components/admin/panelStyles';
import { Seo } from '../../components/seo/Seo';

const PAGE_SIZE = 9;

type TabKey = 'pending' | 'approved' | 'all';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'در انتظار تأیید' },
  { key: 'approved', label: 'تأییدشده' },
  { key: 'all', label: 'همه' },
];

export function CommentsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>('pending');
  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSelected([]);
    fetchAdminComments({
      page,
      is_approved: tab === 'all' ? undefined : tab === 'approved',
    })
      .then((data) => {
        if (cancelled) return;
        setComments(data.results);
        setCount(data.count);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'دریافت دیدگاه‌ها با خطا مواجه شد.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, page, reloadKey]);

  function toggleSelected(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelected((current) => (current.length === comments.length ? [] : comments.map((c) => c.id)));
  }

  async function setApproval(comment: AdminComment, approved: boolean) {
    setBusy(true);
    try {
      await setCommentApproval(comment.id, approved);
      toast.show(approved ? 'دیدگاه تأیید شد.' : 'تأیید دیدگاه لغو شد.', 'success');
      reload();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'عملیات با خطا مواجه شد.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function bulkApprove() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const result = await bulkApproveComments(selected, true);
      toast.show(`${toPersianDigits(result.updated)} دیدگاه تأیید شد.`, 'success');
      reload();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'تأیید گروهی با خطا مواجه شد.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(comment: AdminComment) {
    if (!window.confirm(`دیدگاه «${comment.name}» حذف شود؟`)) return;
    setBusy(true);
    try {
      await deleteAdminComment(comment.id);
      toast.show('دیدگاه حذف شد.', 'success');
      reload();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'حذف دیدگاه با خطا مواجه شد.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <Seo title="مدیریت دیدگاه‌ها" noIndex />

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">دیدگاه‌ها</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          دیدگاه‌ها پس از تأیید شما روی صفحهٔ مقاله نمایش داده می‌شوند.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist" aria-label="فیلتر دیدگاه‌ها">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => {
                setTab(item.key);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                tab === item.key
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {comments.length > 0 && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleAll} className={`${secondaryButton} text-xs`}>
              {selected.length === comments.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </button>
            <button
              type="button"
              onClick={() => void bulkApprove()}
              disabled={selected.length === 0 || busy}
              className={`${primaryButton} text-xs`}
            >
              تأیید {selected.length > 0 ? toPersianDigits(selected.length) : ''} دیدگاه انتخاب‌شده
            </button>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">در حال بارگذاری…</p>}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {!loading && !error && comments.length === 0 && (
        <div className={`${card} text-center`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">دیدگاهی در این فهرست نیست.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className={card}>
            <div className="flex flex-wrap items-start gap-3">
              <input
                type="checkbox"
                aria-label={`انتخاب دیدگاه ${comment.name}`}
                checked={selected.includes(comment.id)}
                onChange={() => toggleSelected(comment.id)}
                className="mt-1.5 h-4 w-4 accent-indigo-600"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {comment.name}
                  </span>
                  <span dir="ltr" className="text-xs text-slate-400">
                    {comment.email}
                  </span>
                  <time className="text-xs text-slate-400" dateTime={comment.created_at}>
                    {formatJalaliDateTime(comment.created_at)}
                  </time>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comment.is_approved
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {comment.is_approved ? 'تأییدشده' : 'در انتظار'}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {comment.body}
                </p>

                <Link
                  to={`/articles/${comment.post_slug}`}
                  className="mt-2 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  روی نوشتهٔ «{comment.post_title}»
                </Link>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void setApproval(comment, !comment.is_approved)}
                  className={`${secondaryButton} text-xs`}
                >
                  {comment.is_approved ? 'لغو تأیید' : 'تأیید'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(comment)}
                  className={`${dangerButton} text-xs`}
                >
                  حذف
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
