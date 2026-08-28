import { Link } from 'react-router-dom';
import type { PostSummary } from '../../lib/types';
import { formatJalaliDate, formatReadingTime } from '../../lib/format';
import { pillClass } from './tokens';

/**
 * Byline row: a mint initial disc, the author's name, the publish date and the
 * reading time. No avatar uploads exist, so the initial stands in for one.
 * Only real metadata appears here, never invented view or comment counts.
 */
export function AuthorRow({ post, className = '' }: { post: PostSummary; className?: string }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-300 text-[0.7rem] font-black text-ink-950"
      >
        {post.author.full_name.trim().charAt(0) || 'ر'}
      </span>
      <span className="font-bold">{post.author.full_name}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
      {readingTime && (
        <>
          <span aria-hidden="true">·</span>
          <span>{readingTime}</span>
        </>
      )}
    </div>
  );
}

/** Category pill, then date and reading time. The card-level meta line. */
export function MetaRow({ post, className = '' }: { post: PostSummary; className?: string }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] ${className}`}>
      {post.category && (
        <Link to={`/articles?category=${post.category.slug}`} className={`press ${pillClass}`}>
          {post.category.name}
        </Link>
      )}
      <span aria-hidden="true">·</span>
      <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
      {readingTime && (
        <>
          <span aria-hidden="true">·</span>
          <span>{readingTime}</span>
        </>
      )}
    </div>
  );
}
