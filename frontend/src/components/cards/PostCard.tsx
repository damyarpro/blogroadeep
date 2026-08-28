import { Link } from 'react-router-dom';
import type { PostSummary } from '../../lib/types';
import { formatJalaliDate, formatReadingTime } from '../../lib/format';
import { CoverImage } from './CoverImage';

export function PostCard({ post }: { post: PostSummary }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <article className="lift group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/30">
      <Link to={`/articles/${post.slug}`} className="block">
        <CoverImage src={post.cover_image} alt={post.title} className="h-44 w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {post.category && (
          <Link
            to={`/articles?category=${post.category.slug}`}
            className="press w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors duration-150 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
          >
            {post.category.name}
          </Link>
        )}
        <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
          <Link to={`/articles/${post.slug}`} className="transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <time dateTime={post.published_at}>{formatJalaliDate(post.published_at)}</time>
          {readingTime && <span>{readingTime}</span>}
        </div>
      </div>
    </article>
  );
}
