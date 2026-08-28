import { Link } from 'react-router-dom';
import type { PostSummary } from '../../lib/types';
import { CoverImage } from '../cards/CoverImage';
import { BookmarkButton } from '../home/BookmarkButton';
import { ArrowIcon } from '../home/icons';
import { MetaRow } from './Meta';
import { arrowChipClass, cardShell } from './tokens';

/**
 * The house article card: a photograph fills the top, and a glass panel laps
 * over its foot carrying the meta row, the title, the excerpt and the arrow.
 * The home page's featured trio and the articles grid render the same object,
 * which is what makes the two pages read as one system.
 */
export function PhotoCard({
  post,
  eager = false,
  mediaClass = 'h-64 sm:h-72',
}: {
  post: PostSummary;
  eager?: boolean;
  mediaClass?: string;
}) {
  return (
    <article className="group flex h-full flex-col">
      <Link
        to={`/articles/${post.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="block overflow-hidden rounded-3xl bg-ink-900"
      >
        <CoverImage
          src={post.cover_image}
          alt=""
          seed={post.slug}
          photo="800/600"
          eager={eager}
          className={`w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.04] ${mediaClass}`}
        />
      </Link>

      <div className="glass relative z-10 mx-4 -mt-16 flex flex-1 flex-col gap-3 rounded-3xl border border-bone-50/60 p-4 shadow-[0_20px_45px_-28px_rgb(12_13_13/0.55)] dark:border-ink-700/60">
        <div className="flex items-start justify-between gap-2">
          <MetaRow post={post} className="text-ink-600 dark:text-bone-300" />
          <BookmarkButton slug={post.slug} title={post.title} />
        </div>

        <h3 className="min-h-[3.1rem] text-lg leading-snug font-black tracking-tight text-ink-950 dark:text-bone-50">
          <Link to={`/articles/${post.slug}`} className="line-clamp-2 hover:underline underline-offset-4">
            {post.title}
          </Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="line-clamp-2 text-xs leading-6 text-ink-600 dark:text-bone-300">{post.excerpt}</p>
          <Link to={`/articles/${post.slug}`} aria-label={`خواندن «${post.title}»`} className={arrowChipClass}>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder shaped exactly like the card above. */
export function PhotoCardSkeleton({ mediaClass = 'h-64 sm:h-72' }: { mediaClass?: string }) {
  return (
    <div aria-hidden="true">
      <div className={`w-full animate-pulse rounded-3xl bg-bone-300 dark:bg-ink-800 ${mediaClass}`} />
      <div className={`relative z-10 mx-4 -mt-16 space-y-3 rounded-3xl p-4 ${cardShell}`}>
        <div className="h-5 w-32 animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        <div className="h-5 w-full animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        <div className="flex justify-end">
          <div className="h-9 w-9 animate-pulse rounded-full bg-bone-300 dark:bg-ink-800" />
        </div>
      </div>
    </div>
  );
}
