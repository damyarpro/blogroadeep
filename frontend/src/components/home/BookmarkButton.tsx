import { useBookmark } from '../../lib/bookmarks';
import { BookmarkIcon } from './icons';

/**
 * Saves a post to the reader's local reading list. Real state, kept in
 * localStorage: pressed means saved, and it survives a reload.
 */
export function BookmarkButton({
  slug,
  title,
  tone = 'light',
}: {
  slug: string;
  title: string;
  tone?: 'light' | 'plain';
}) {
  const [saved, toggle] = useBookmark(slug);

  const shell =
    tone === 'light'
      ? 'text-ink-600 hover:bg-ink-950 hover:text-mint-300 dark:text-bone-300 dark:hover:bg-mint-300 dark:hover:text-ink-950'
      : 'text-ink-400 hover:bg-bone-200 hover:text-ink-950 dark:text-bone-400 dark:hover:bg-ink-800 dark:hover:text-bone-50';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `حذف «${title}» از فهرست خواندن` : `ذخیرهٔ «${title}» در فهرست خواندن`}
      title={saved ? 'ذخیره شده' : 'ذخیره برای بعد'}
      className={`press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
        saved ? 'bg-mint-300 text-ink-950 hover:bg-mint-400 dark:bg-mint-300 dark:text-ink-950' : shell
      }`}
    >
      <BookmarkIcon filled={saved} className="h-4 w-4" />
    </button>
  );
}
