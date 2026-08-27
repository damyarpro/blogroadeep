import { Link } from 'react-router-dom';
import type { Tag } from '../../lib/types';

export function TagList({ tags }: { tags: Tag[] }) {
  if (!tags?.length) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="برچسب‌ها">
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Link
            to={`/articles?tag=${tag.slug}`}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            #{tag.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
