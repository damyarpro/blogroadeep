import { useMemo, useState, type KeyboardEvent } from 'react';
import type { Tag } from '../../lib/types';
import { input, label } from './panelStyles';

interface TagMultiSelectProps {
  tags: Tag[];
  selected: number[];
  onChange: (ids: number[]) => void;
  /** Creates a tag on the backend and returns its id, for create-on-the-fly. */
  onCreate: (name: string) => Promise<number | null>;
}

export function TagMultiSelect({ tags, selected, onChange, onCreate }: TagMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const selectedTags = useMemo(
    () => tags.filter((tag) => tag.id !== undefined && selected.includes(tag.id)),
    [tags, selected],
  );

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tags
      .filter((tag) => tag.id !== undefined && !selected.includes(tag.id))
      .filter((tag) => (needle ? tag.name.toLowerCase().includes(needle) : true))
      .slice(0, 12);
  }, [tags, selected, query]);

  const exactExists = tags.some(
    (tag) => tag.name.trim().toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = query.trim().length > 0 && !exactExists;

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  async function create() {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const id = await onCreate(name);
      if (id !== null) {
        onChange(selected.includes(id) ? selected : [...selected, id]);
        setQuery('');
      }
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (canCreate) {
      void create();
      return;
    }
    const first = suggestions[0];
    if (first?.id !== undefined) {
      toggle(first.id);
      setQuery('');
    }
  }

  return (
    <div>
      <label htmlFor="post-tags" className={label}>
        برچسب‌ها
      </label>

      {selectedTags.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => toggle(tag.id as number)}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
              >
                {tag.name}
                <span aria-hidden="true">×</span>
                <span className="sr-only">حذف برچسب</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id="post-tags"
        type="text"
        className={input}
        value={query}
        placeholder="جستجو یا ساخت برچسب تازه…"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {canCreate && (
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className="rounded-full border border-dashed border-indigo-400 px-3 py-1 text-xs text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            {creating ? 'در حال ساخت…' : `ساخت برچسب «${query.trim()}»`}
          </button>
        )}
        {suggestions.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id as number)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {tag.name}
          </button>
        ))}
        {!canCreate && suggestions.length === 0 && (
          <p className="text-xs text-slate-400">برچسب دیگری برای افزودن نیست.</p>
        )}
      </div>
    </div>
  );
}
