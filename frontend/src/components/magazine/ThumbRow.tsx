import { Link } from 'react-router-dom';
import type { PostSummary } from '../../lib/types';
import { formatReadingTime } from '../../lib/format';
import { CoverImage } from '../cards/CoverImage';
import { ArrowIcon } from '../home/icons';
import { arrowChipClass, cardShell, pillClass } from './tokens';

/**
 * A photo thumbnail paired with a compact text card. Used for the stacked half
 * of the home bento, the related reads under an article, and the way back out
 * of the 404 page, so a secondary list looks the same everywhere.
 */
export function ThumbRow({ post, mediaClass = 'h-44 lg:h-[13rem]' }: { post: PostSummary; mediaClass?: string }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <article className="group grid grid-cols-2 gap-3">
      <Link
        to={`/articles/${post.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="block overflow-hidden rounded-3xl bg-ink-900"
      >
        <CoverImage
          src={post.cover_image}
          alt=""
          seed={`${post.slug}-thumb`}
          photo="600/700"
          className={`w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.05] ${mediaClass}`}
        />
      </Link>

      <div className={`flex flex-col p-4 ${cardShell}`}>
        {/* Narrow card: no middot separator, because it strands on its own line. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-ink-600 dark:text-bone-300">
          {post.category && (
            <Link to={`/articles?category=${post.category.slug}`} className={`press ${pillClass}`}>
              {post.category.name}
            </Link>
          )}
          {readingTime && <span>{readingTime}</span>}
        </div>

        <h3 className="mt-3 leading-snug font-black tracking-tight text-ink-950 dark:text-bone-50">
          <Link to={`/articles/${post.slug}`} className="line-clamp-2 hover:underline underline-offset-4">
            {post.title}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-end pt-4">
          <Link to={`/articles/${post.slug}`} aria-label={`خواندن «${post.title}»`} className={arrowChipClass}>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
