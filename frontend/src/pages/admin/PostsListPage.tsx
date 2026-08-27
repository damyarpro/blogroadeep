import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  deleteAdminPost,
  fetchAdminCategories,
  fetchAdminPosts,
  patchAdminPost,
} from '../../lib/api';
import type { AdminPostSummary, Category, PostStatus } from '../../lib/types';
import { formatJalaliDate, toPersianDigits } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../components/admin/Toaster';
import {
  card,
  dangerButton,
  input,
  primaryButton,
  secondaryButton,
  statusBadge,
} from '../../components/admin/panelStyles';
import { Seo } from '../../components/seo/Seo';

const PAGE_SIZE = 9;

const statusFilters: { value: '' | PostStatus; label: string }[] = [
  { value: '', label: 'همه' },
  { value: 'published', label: 'منتشرشده' },
  { value: 'draft', label: 'پیش‌نویس' },
];

export function PostsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const status = (searchParams.get('status') ?? '') as '' | PostStatus;
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [posts, setPosts] = useState<AdminPostSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === search) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchAdminCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAdminPosts({
      page,
      status,
      search: search || undefined,
      category: category ? Number(category) : '',
    })
      .then((data) => {
        if (cancelled) return;
        setPosts(data.results);
        setCount(data.count);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'دریافت نوشته‌ها با خطا مواجه شد.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, search, category]);

  useEffect(() => load(), [load, reloadKey]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  async function togglePublish(post: AdminPostSummary) {
    setBusyId(post.id);
    try {
      await patchAdminPost(post.id, {
        status: post.status === 'published' ? 'draft' : 'published',
      });
      toast.show(
        post.status === 'published' ? 'نوشته به پیش‌نویس بازگشت.' : 'نوشته منتشر شد.',
        'success',
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'تغییر وضعیت با خطا مواجه شد.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(post: AdminPostSummary) {
    if (!window.confirm(`نوشتهٔ «${post.title}» برای همیشه حذف شود؟`)) return;
    setBusyId(post.id);
    try {
      await deleteAdminPost(post.id);
      toast.show('نوشته حذف شد.', 'success');
      setReloadKey((key) => key + 1);
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'حذف نوشته با خطا مواجه شد.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <Seo title="مدیریت نوشته‌ها" noIndex />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">نوشته‌ها</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {toPersianDigits(count)} نوشته ثبت شده است.
          </p>
        </div>
        <Link to="/admin/posts/new" className={primaryButton}>
          نوشتهٔ جدید
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <label htmlFor="admin-post-search" className="sr-only">
            جستجو در نوشته‌ها
          </label>
          <input
            id="admin-post-search"
            type="search"
            className={input}
            placeholder="جستجو در عنوان و متن…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <label htmlFor="admin-post-category" className="sr-only">
          فیلتر بر اساس دسته‌بندی
        </label>
        <select
          id="admin-post-category"
          className={`${input} w-auto min-w-40`}
          value={category}
          onChange={(event) => setParam('category', event.target.value)}
        >
          <option value="">همهٔ دسته‌ها</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5" role="group" aria-label="فیلتر بر اساس وضعیت">
          {statusFilters.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => setParam('status', filter.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                status === filter.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">در حال بارگذاری…</p>}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className={`${card} text-center`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            نوشته‌ای با این مشخصات پیدا نشد.
          </p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    className="block truncate text-sm font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
                  >
                    {post.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className={statusBadge(post.is_published)}>
                      {post.is_published ? 'منتشرشده' : 'پیش‌نویس'}
                    </span>
                    {post.category && <span>{post.category.name}</span>}
                    <time dateTime={post.published_at ?? post.created_at}>
                      {formatJalaliDate(post.published_at ?? post.created_at)}
                    </time>
                    {post.pending_comment_count > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {toPersianDigits(post.pending_comment_count)} دیدگاه در انتظار
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link to={`/admin/posts/${post.id}/edit`} className={`${secondaryButton} text-xs`}>
                    ویرایش
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => void togglePublish(post)}
                    className={`${secondaryButton} text-xs`}
                  >
                    {post.status === 'published' ? 'لغو انتشار' : 'انتشار'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => void remove(post)}
                    className={`${dangerButton} text-xs`}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={(next) => setSearchParams({ ...Object.fromEntries(searchParams), page: String(next) })}
      />
    </div>
  );
}
