import { Link } from 'react-router-dom';
import type { Tag } from '../../lib/types';

export function TagList({ tags }: { tags: Tag[] }) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-600 dark:text-bone-400">برچسب‌ها:</span>
      <ul className="flex flex-wrap gap-2" aria-label="برچسب‌ها">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link
              to={`/articles?tag=${tag.slug}`}
              className="press inline-block rounded-full bg-bone-200 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950"
            >
              #{tag.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
