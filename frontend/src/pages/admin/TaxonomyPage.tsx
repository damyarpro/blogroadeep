import { useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  createAdminCategory,
  createAdminTag,
  deleteAdminCategory,
  deleteAdminTag,
  fetchAdminCategories,
  fetchAdminTags,
  updateAdminCategory,
  updateAdminTag,
} from '../../lib/api';
import type { Category, Tag } from '../../lib/types';
import { toPersianDigits } from '../../lib/format';
import { useToast } from '../../components/admin/Toaster';
import {
  card,
  dangerButton,
  input,
  primaryButton,
  secondaryButton,
} from '../../components/admin/panelStyles';
import { Seo } from '../../components/seo/Seo';

type Term = Category | Tag;

interface TermListProps {
  title: string;
  description: string;
  terms: Term[];
  placeholder: string;
  busy: boolean;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (term: Term) => Promise<void>;
}

function TermList({
  title,
  description,
  terms,
  placeholder,
  busy,
  onCreate,
  onRename,
  onDelete,
}: TermListProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;
    await onCreate(newName.trim());
    setNewName('');
  }

  async function commitRename(id: number) {
    if (!editingName.trim()) return;
    await onRename(id, editingName.trim());
    setEditingId(null);
  }

  return (
    <section className={card}>
      <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">{description}</p>

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          type="text"
          className={input}
          placeholder={placeholder}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          aria-label={placeholder}
        />
        <button type="submit" disabled={busy || !newName.trim()} className={`${primaryButton} shrink-0`}>
          افزودن
        </button>
      </form>

      {terms.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">هنوز موردی ثبت نشده است.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {terms.map((term) => (
            <li key={term.id} className="flex flex-wrap items-center gap-2 py-2.5">
              {editingId === term.id ? (
                <>
                  <input
                    type="text"
                    className={`${input} flex-1`}
                    value={editingName}
                    autoFocus
                    aria-label="نام تازه"
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void commitRename(term.id as number);
                      if (event.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void commitRename(term.id as number)}
                    className={`${primaryButton} text-xs`}
                  >
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className={`${secondaryButton} text-xs`}
                  >
                    انصراف
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {term.name}
                    </p>
                    <p dir="ltr" className="truncate text-start text-xs text-slate-400">
                      /{term.slug}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {toPersianDigits(term.post_count)} نوشته
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(term.id as number);
                      setEditingName(term.name);
                    }}
                    className={`${secondaryButton} text-xs`}
                  >
                    تغییر نام
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDelete(term)}
                    className={`${dangerButton} text-xs`}
                  >
                    حذف
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TaxonomyPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function reload() {
    return Promise.all([fetchAdminCategories(), fetchAdminTags()])
      .then(([nextCategories, nextTags]) => {
        setCategories(nextCategories);
        setTags(nextTags);
      })
      .catch((error) => {
        toast.show(
          error instanceof ApiError ? error.message : 'دریافت داده‌ها با خطا مواجه شد.',
          'error',
        );
      });
  }

  useEffect(() => {
    void reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await reload();
      toast.show(success, 'success');
    } catch (error) {
      toast.show(error instanceof ApiError ? error.message : 'عملیات با خطا مواجه شد.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Seo title="دسته‌ها و برچسب‌ها" noIndex />

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">دسته‌ها و برچسب‌ها</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          ساختار موضوعی وبلاگ را اینجا مدیریت کنید. نامک به‌صورت خودکار از نام ساخته می‌شود.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">در حال بارگذاری…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <TermList
            title="دسته‌بندی‌ها"
            description="هر نوشته می‌تواند در یک دسته‌بندی قرار بگیرد."
            placeholder="نام دستهٔ تازه"
            terms={categories}
            busy={busy}
            onCreate={(name) => run(() => createAdminCategory({ name }), 'دسته‌بندی ساخته شد.')}
            onRename={(id, name) =>
              run(() => updateAdminCategory(id, { name }), 'نام دسته‌بندی تغییر کرد.')
            }
            onDelete={(term) =>
              window.confirm(`دستهٔ «${term.name}» حذف شود؟ نوشته‌های آن بدون دسته می‌مانند.`)
                ? run(() => deleteAdminCategory(term.id as number), 'دسته‌بندی حذف شد.')
                : Promise.resolve()
            }
          />

          <TermList
            title="برچسب‌ها"
            description="برچسب‌ها برای پیوند دادن موضوعات مرتبط به کار می‌روند."
            placeholder="نام برچسب تازه"
            terms={tags}
            busy={busy}
            onCreate={(name) => run(() => createAdminTag({ name }), 'برچسب ساخته شد.')}
            onRename={(id, name) => run(() => updateAdminTag(id, { name }), 'نام برچسب تغییر کرد.')}
            onDelete={(term) =>
              window.confirm(`برچسب «${term.name}» حذف شود؟`)
                ? run(() => deleteAdminTag(term.id as number), 'برچسب حذف شد.')
                : Promise.resolve()
            }
          />
        </div>
      )}
    </div>
  );
}
