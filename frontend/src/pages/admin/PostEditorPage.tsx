import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ApiError,
  createAdminPost,
  createAdminTag,
  fetchAdminCategories,
  fetchAdminPost,
  fetchAdminTags,
  updateAdminPost,
} from '../../lib/api';
import type { AdminPost, Category, PostStatus, Tag } from '../../lib/types';
import { formatJalaliDateTime, toPersianDigits } from '../../lib/format';
import { analyzeContent } from '../../lib/seoChecks';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { CoverImageField } from '../../components/admin/CoverImageField';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { SeoPanel, type SeoValues } from '../../components/admin/SeoPanel';
import { SlugField } from '../../components/admin/SlugField';
import { TagMultiSelect } from '../../components/admin/TagMultiSelect';
import { useToast } from '../../components/admin/Toaster';
import {
  card,
  hint,
  input,
  label,
  primaryButton,
  secondaryButton,
} from '../../components/admin/panelStyles';
import { Seo } from '../../components/seo/Seo';

interface EditorForm extends SeoValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: number | null;
  tagIds: number[];
  status: PostStatus;
  publishedAt: string;
}

const emptyForm: EditorForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  categoryId: null,
  tagIds: [],
  status: 'draft',
  publishedAt: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
};

const EXCERPT_LIMIT = 300;

/** Mirrors Django's `slugify(value, allow_unicode=True)` closely enough for a suggestion. */
function suggestSlug(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '-');
}

/** ISO 8601 → the `YYYY-MM-DDTHH:mm` shape `<input type="datetime-local">` wants. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formFromPost(post: AdminPost): EditorForm {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    content: post.content ?? '',
    categoryId: post.category ?? null,
    tagIds: post.tags.map((tag) => tag.id),
    status: post.status,
    publishedAt: toLocalInput(post.published_at),
    metaTitle: post.meta_title ?? '',
    metaDescription: post.meta_description ?? '',
    metaKeywords: post.meta_keywords ?? '',
    canonicalUrl: post.canonical_url ?? '',
  };
}

function draftStorageKey(id: string | undefined): string {
  return `panel_draft_${id ?? 'new'}`;
}

interface StoredDraft {
  savedAt: string;
  form: EditorForm;
}

function readStoredDraft(key: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    return parsed?.form ? parsed : null;
  } catch {
    return null;
  }
}

export function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id;

  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(emptyForm));
  const [post, setPost] = useState<AdminPost | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pendingDraft, setPendingDraft] = useState<StoredDraft | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);

  const storageKey = draftStorageKey(id);
  const dirty = JSON.stringify(form) !== savedSnapshot || coverFile !== null || removeCover;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // --- loading -------------------------------------------------------------

  useEffect(() => {
    fetchAdminCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    fetchAdminTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPendingDraft(null);

    if (isNew) {
      setForm(emptyForm);
      setSavedSnapshot(JSON.stringify(emptyForm));
      setSlugTouched(false);
      setEditorResetKey((key) => key + 1);
      const stored = readStoredDraft(storageKey);
      if (stored && JSON.stringify(stored.form) !== JSON.stringify(emptyForm)) {
        setPendingDraft(stored);
      }
      return;
    }

    setLoading(true);
    setLoadError('');
    fetchAdminPost(Number(id))
      .then((data) => {
        if (cancelled) return;
        const next = formFromPost(data);
        setPost(data);
        setForm(next);
        setSavedSnapshot(JSON.stringify(next));
        setSlugTouched(true);
        setEditorResetKey((key) => key + 1);
        const stored = readStoredDraft(storageKey);
        if (stored && JSON.stringify(stored.form) !== JSON.stringify(next)) {
          setPendingDraft(stored);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError ? error.message : 'دریافت نوشته با خطا مواجه شد.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- derived -------------------------------------------------------------

  const patch = useCallback((changes: Partial<EditorForm>) => {
    setForm((current) => ({ ...current, ...changes }));
  }, []);

  const suggestedSlug = useMemo(() => suggestSlug(form.title), [form.title]);
  const effectiveSlug = slugTouched ? form.slug : suggestedSlug;
  const stats = useMemo(() => analyzeContent(form.content), [form.content]);

  // Preview a not-yet-uploaded cover from a blob URL so the SEO card is truthful.
  const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!coverFile) {
      setCoverObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const coverPreview = coverObjectUrl ?? (removeCover ? null : (post?.cover_image ?? null));

  // --- autosave ------------------------------------------------------------

  const debouncedForm = useDebouncedValue(form, 900);

  useEffect(() => {
    if (loading || !dirtyRef.current) return;
    try {
      const record: StoredDraft = { savedAt: new Date().toISOString(), form: debouncedForm };
      window.localStorage.setItem(storageKey, JSON.stringify(record));
      setAutosavedAt(record.savedAt);
    } catch {
      // localStorage unavailable — autosave is best-effort.
    }
  }, [debouncedForm, loading, storageKey]);

  // Browser-level guard; in-panel navigation is guarded by the back button below.
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // --- saving --------------------------------------------------------------

  const save = useCallback(
    async (overrideStatus?: PostStatus) => {
      if (saving) return;
      const status = overrideStatus ?? form.status;
      if (!form.title.trim()) {
        toast.show('عنوان نوشته را وارد کنید.', 'error');
        return;
      }

      setSaving(true);
      setFieldErrors({});
      const payload = {
        title: form.title.trim(),
        slug: (slugTouched ? form.slug : suggestedSlug).trim(),
        excerpt: form.excerpt,
        content: form.content,
        category: form.categoryId,
        tags: form.tagIds,
        status,
        published_at: fromLocalInput(form.publishedAt),
        meta_title: form.metaTitle,
        meta_description: form.metaDescription,
        meta_keywords: form.metaKeywords,
        canonical_url: form.canonicalUrl,
        ...(coverFile ? { cover_image: coverFile } : {}),
        ...(removeCover && !coverFile ? { remove_cover_image: true } : {}),
      };

      try {
        const saved = isNew
          ? await createAdminPost(payload)
          : await updateAdminPost(Number(id), payload);

        const next = formFromPost(saved);
        setPost(saved);
        setForm(next);
        setSavedSnapshot(JSON.stringify(next));
        setSlugTouched(true);
        setCoverFile(null);
        setRemoveCover(false);
        setAutosavedAt(null);
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
        toast.show(
          status === 'published' ? 'نوشته منتشر شد.' : 'نوشته ذخیره شد.',
          'success',
        );
        if (isNew) {
          navigate(`/admin/posts/${saved.id}/edit`, { replace: true });
        }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.fields) setFieldErrors(error.fields);
          toast.show(error.message || 'ذخیرهٔ نوشته با خطا مواجه شد.', 'error');
        } else {
          toast.show('ذخیرهٔ نوشته با خطا مواجه شد.', 'error');
        }
      } finally {
        setSaving(false);
      }
    },
    [
      coverFile,
      form,
      id,
      isNew,
      navigate,
      removeCover,
      saving,
      slugTouched,
      storageKey,
      suggestedSlug,
      toast,
    ],
  );

  const saveRef = useRef(save);
  saveRef.current = save;

  // Ctrl/Cmd+S saves without leaving the keyboard.
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveRef.current();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function goBack() {
    if (dirty && !window.confirm('تغییرات ذخیره‌نشده دارید. از این صفحه خارج می‌شوید؟')) {
      return;
    }
    navigate('/admin/posts');
  }

  async function createTag(name: string): Promise<number | null> {
    try {
      const created = await createAdminTag({ name });
      setTags((current) => [...current, { ...created, post_count: 0 }]);
      toast.show(`برچسب «${created.name}» ساخته شد.`, 'success');
      return created.id;
    } catch (error) {
      toast.show(
        error instanceof ApiError ? error.message : 'ساخت برچسب با خطا مواجه شد.',
        'error',
      );
      return null;
    }
  }

  function restoreDraft() {
    if (!pendingDraft) return;
    setForm(pendingDraft.form);
    setSlugTouched(true);
    setEditorResetKey((key) => key + 1);
    setPendingDraft(null);
    toast.show('پیش‌نویس محلی بازیابی شد.', 'success');
  }

  function discardDraft() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setPendingDraft(null);
  }

  // --- render --------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          role="status"
          aria-label="در حال بارگذاری"
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={card}>
        <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Seo title={isNew ? 'نوشتهٔ جدید' : 'ویرایش نوشته'} noIndex />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={goBack}
            className="mb-1 text-xs text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            ← بازگشت به فهرست نوشته‌ها
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isNew ? 'نوشتهٔ جدید' : 'ویرایش نوشته'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              تغییرات ذخیره‌نشده
              {autosavedAt && ` · پیش‌نویس محلی ${formatJalaliDateTime(autosavedAt)}`}
            </span>
          )}
          {post && post.is_published && (
            <a
              href={`/articles/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryButton} text-xs`}
            >
              مشاهده در سایت
            </a>
          )}
          {form.status !== 'published' && (
            <button
              type="button"
              onClick={() => void save('draft')}
              disabled={saving}
              className={secondaryButton}
            >
              ذخیره به‌عنوان پیش‌نویس
            </button>
          )}
          <button
            type="button"
            onClick={() => void save(form.status === 'published' ? undefined : 'published')}
            disabled={saving}
            className={primaryButton}
            title="ذخیره (Ctrl+S)"
          >
            {saving
              ? 'در حال ذخیره…'
              : form.status === 'published'
                ? 'ذخیره و به‌روزرسانی'
                : 'انتشار'}
          </button>
        </div>
      </div>

      {pendingDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            یک پیش‌نویس ذخیره‌نشده از {formatJalaliDateTime(pendingDraft.savedAt)} در این مرورگر پیدا
            شد. می‌خواهید بازیابی شود؟
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={restoreDraft} className={`${primaryButton} text-xs`}>
              بازیابی پیش‌نویس
            </button>
            <button type="button" onClick={discardDraft} className={`${secondaryButton} text-xs`}>
              نادیده بگیر
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <div className={card}>
            <label htmlFor="post-title" className={label}>
              عنوان نوشته
            </label>
            <input
              id="post-title"
              type="text"
              className={`${input} text-lg font-bold`}
              value={form.title}
              placeholder="عنوان جذاب و گویا بنویسید…"
              onChange={(event) => patch({ title: event.target.value })}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {fieldErrors.title.join(' ')}
              </p>
            )}

            <div className="mt-4">
              <SlugField
                value={effectiveSlug}
                touched={slugTouched}
                excludeId={post?.id}
                errors={fieldErrors.slug}
                onChange={(next) => {
                  setSlugTouched(true);
                  patch({ slug: next });
                }}
                onReset={() => {
                  setSlugTouched(false);
                  patch({ slug: suggestedSlug });
                }}
              />
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="post-excerpt" className={label}>
                  خلاصه
                </label>
                <span
                  className={`text-xs ${
                    form.excerpt.length > EXCERPT_LIMIT
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {toPersianDigits(form.excerpt.length)} از {toPersianDigits(EXCERPT_LIMIT)} نویسه
                </span>
              </div>
              <textarea
                id="post-excerpt"
                rows={3}
                className={input}
                value={form.excerpt}
                placeholder="در دو یا سه جمله بگویید این نوشته دربارهٔ چیست…"
                onChange={(event) => patch({ excerpt: event.target.value })}
              />
              <p className={hint}>
                خلاصه در کارت مقالات، نتایج جستجو و کارت اشتراک‌گذاری استفاده می‌شود.
              </p>
            </div>
          </div>

          <div>
            <span className={label}>متن نوشته</span>
            <RichTextEditor
              value={form.content}
              resetKey={editorResetKey}
              onChange={(html) => patch({ content: html })}
              onNotify={toast.show}
            />
            {fieldErrors.content && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {fieldErrors.content.join(' ')}
              </p>
            )}
          </div>

          <SeoPanel
            values={{
              metaTitle: form.metaTitle,
              metaDescription: form.metaDescription,
              metaKeywords: form.metaKeywords,
              canonicalUrl: form.canonicalUrl,
            }}
            onChange={patch}
            title={form.title}
            slug={effectiveSlug}
            excerpt={form.excerpt}
            content={form.content}
            coverImage={coverPreview}
            categoryId={form.categoryId}
            stats={stats}
          />
        </div>

        <aside className="flex flex-col gap-5">
          <div className={card}>
            <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">انتشار</h2>

            <div className="mb-4">
              <label htmlFor="post-status" className={label}>
                وضعیت
              </label>
              <select
                id="post-status"
                className={input}
                value={form.status}
                onChange={(event) => patch({ status: event.target.value as PostStatus })}
              >
                <option value="draft">پیش‌نویس</option>
                <option value="published">منتشرشده</option>
              </select>
            </div>

            <div>
              <label htmlFor="post-published-at" className={label}>
                تاریخ و ساعت انتشار
              </label>
              <input
                id="post-published-at"
                type="datetime-local"
                dir="ltr"
                className={`${input} text-start`}
                value={form.publishedAt}
                onChange={(event) => patch({ publishedAt: event.target.value })}
              />
              <p className={hint}>
                خالی بگذارید تا هنگام انتشار، زمان همان لحظه ثبت شود.
                {form.publishedAt && ` (${formatJalaliDateTime(fromLocalInput(form.publishedAt))})`}
              </p>
            </div>

            {post && (
              <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div className="flex justify-between gap-2">
                  <dt>نویسنده</dt>
                  <dd>{post.author.full_name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>آخرین ویرایش</dt>
                  <dd>{formatJalaliDateTime(post.updated_at)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>زمان مطالعه</dt>
                  <dd>{toPersianDigits(post.reading_time ?? 0)} دقیقه</dd>
                </div>
              </dl>
            )}
          </div>

          <div className={card}>
            <div className="mb-4">
              <label htmlFor="post-category" className={label}>
                دسته‌بندی
              </label>
              <select
                id="post-category"
                className={input}
                value={form.categoryId ?? ''}
                onChange={(event) =>
                  patch({ categoryId: event.target.value ? Number(event.target.value) : null })
                }
              >
                <option value="">بدون دسته‌بندی</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <TagMultiSelect
              tags={tags}
              selected={form.tagIds}
              onChange={(ids) => patch({ tagIds: ids })}
              onCreate={createTag}
            />
          </div>

          <div className={card}>
            <CoverImageField
              preview={coverPreview}
              fileName={coverFile?.name ?? null}
              onPick={(file) => {
                setCoverFile(file);
                if (file) setRemoveCover(false);
              }}
              onRemove={() => setRemoveCover(true)}
            />
            <p className={hint}>تصویر شاخص در کارت مقاله و کارت اشتراک‌گذاری استفاده می‌شود.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
