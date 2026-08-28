import { Link } from 'react-router-dom';
import type { Tag } from '../../lib/types';
import { pillClass } from '../magazine/tokens';

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
              className={`press inline-block ${pillClass}`}
            >
              #{tag.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
