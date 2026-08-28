import { Link } from 'react-router-dom';
import type { Tag } from '../../lib/types';

export function TagList({ tags }: { tags: Tag[] }) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">برچسب‌ها:</span>
      <ul className="flex flex-wrap gap-2" aria-label="برچسب‌ها">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link
              to={`/articles?tag=${tag.slug}`}
              className="press inline-block rounded-full bg-slate-100 px-3 py-1 text-xs whitespace-nowrap text-slate-600 transition-colors duration-150 hover:bg-slate-200 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
            >
              #{tag.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
