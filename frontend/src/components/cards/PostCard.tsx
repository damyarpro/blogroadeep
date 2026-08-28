import { Link } from 'react-router-dom';
import type { PostSummary } from '../../lib/types';
import { formatJalaliDate, formatReadingTime } from '../../lib/format';
import { CoverImage } from './CoverImage';

/** Solid-fill treatments. Mixing them across a grid gives the tile rhythm. */
export type CardTone = 'bone' | 'ink' | 'mint';

const toneShell: Record<CardTone, string> = {
  bone: 'border border-bone-300 bg-bone-50 dark:border-ink-700 dark:bg-ink-900',
  ink: 'bg-ink-950 dark:bg-ink-800',
  mint: 'bg-mint-300 dark:bg-mint-300',
};

const toneTitle: Record<CardTone, string> = {
  bone: 'text-ink-950 dark:text-bone-50',
  ink: 'text-bone-50',
  mint: 'text-ink-950',
};

const toneBody: Record<CardTone, string> = {
  bone: 'text-ink-600 dark:text-bone-300',
  ink: 'text-bone-300',
  mint: 'text-forest-900',
};

const toneMeta: Record<CardTone, string> = {
  bone: 'text-ink-600 dark:text-bone-400',
  ink: 'text-bone-400',
  mint: 'text-forest-800',
};

const toneChip: Record<CardTone, string> = {
  bone: 'bg-mint-300 text-ink-950 hover:bg-mint-400',
  ink: 'bg-mint-300 text-ink-950 hover:bg-mint-400',
  mint: 'bg-ink-950 text-mint-300 hover:bg-ink-900',
};

const toneArrow: Record<CardTone, string> = {
  bone: 'bg-ink-950 text-bone-50 group-hover:bg-forest-800 dark:bg-mint-300 dark:text-ink-950 dark:group-hover:bg-mint-400',
  ink: 'bg-mint-300 text-ink-950 group-hover:bg-mint-400',
  mint: 'bg-ink-950 text-mint-300 group-hover:bg-forest-900',
};

const toneFrame: Record<CardTone, string> = {
  bone: 'bg-ink-950 dark:bg-ink-950',
  ink: 'bg-ink-900 dark:bg-ink-950',
  mint: 'bg-forest-900',
};

export function PostCard({ post, tone = 'bone' }: { post: PostSummary; tone?: CardTone }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <article className={`lift group flex h-full flex-col overflow-hidden rounded-3xl ${toneShell[tone]}`}>
      {/* The cover sits in a charcoal frame, like a mounted photograph. */}
      <div className={`p-2 ${toneFrame[tone]}`}>
        <Link to={`/articles/${post.slug}`} className="block" tabIndex={-1} aria-hidden="true">
          <CoverImage src={post.cover_image} alt="" seed={post.slug} className="h-44 w-full rounded-2xl" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.category && (
          <Link
            to={`/articles?category=${post.category.slug}`}
            className={`press w-fit rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap transition-colors duration-150 ${toneChip[tone]}`}
          >
            {post.category.name}
          </Link>
        )}

        <h3 className={`text-xl leading-snug font-black tracking-tight ${toneTitle[tone]}`}>
          <Link to={`/articles/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className={`line-clamp-2 flex-1 text-sm ${toneBody[tone]}`}>{post.excerpt}</p>

        <div className={`mt-auto flex items-center justify-between gap-3 pt-1 text-xs ${toneMeta[tone]}`}>
          <span className="flex flex-wrap items-center gap-x-2">
            <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
            {readingTime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readingTime}</span>
              </>
            )}
          </span>

          <Link
            to={`/articles/${post.slug}`}
            aria-label={`خواندن «${post.title}»`}
            className={`press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${toneArrow[tone]}`}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6-6m-6 6 6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
