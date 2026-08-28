import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, isStaticMode } from '../../lib/api';
import type { PostSummary } from '../../lib/types';
import { formatJalaliDate } from '../../lib/format';
import { CalendarIcon, ChevronIcon, RssIcon } from './icons';

const MAX_HEADLINES = 5;

/** Longer lists need longer to travel, otherwise they blur past. */
function durationFor(count: number): string {
  return `${Math.max(24, count * 9)}s`;
}

function HeadlineList({ posts, decorative }: { posts: PostSummary[]; decorative?: boolean }) {
  return (
    <ul
      className="ticker-copy flex shrink-0 items-center gap-8 ps-8"
      aria-hidden={decorative || undefined}
      inert={decorative || undefined}
    >
      {posts.map((post) => (
        <li key={post.slug} className="ticker-item flex items-center gap-8 whitespace-nowrap">
          <Link
            to={`/articles/${post.slug}`}
            tabIndex={decorative ? -1 : undefined}
            className="text-xs font-medium text-bone-100 underline-offset-4 transition-colors duration-150 hover:text-mint-300 hover:underline sm:text-sm"
          >
            {post.title}
          </Link>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ink-400" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Breaking-headline bar: the newest titles loop past, pausing on hover or focus.
 * The arrows rotate the list so a reader can step to the next headline instead of
 * waiting for it, which is also how the bar works under prefers-reduced-motion
 * (no loop, one headline at a time).
 */
export function NewsTicker() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPosts({ page: 1 })
      .then((data) => {
        if (!cancelled) setPosts(data.results.slice(0, MAX_HEADLINES));
      })
      .catch(() => {
        // The bar is chrome, not content: stay quiet and render nothing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (posts.length === 0) return null;

  const rotated = [...posts.slice(offset % posts.length), ...posts.slice(0, offset % posts.length)];
  const step = (delta: number) => setOffset((value) => (value + delta + posts.length) % posts.length);

  const arrowClass =
    'press inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 text-bone-100 transition-colors duration-150 hover:border-mint-300 hover:bg-mint-300 hover:text-ink-950';

  return (
    <div className="bg-ink-950 text-bone-300">
      <div className="mx-auto flex max-w-[88rem] items-center gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex shrink-0 items-center gap-1.5 rounded-full bg-bone-50 px-3 py-1 text-[0.7rem] font-black whitespace-nowrap text-ink-950">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mint-400" />
          تازه‌ها
        </p>

        {/* key restarts the loop when the reader steps to another headline */}
        <div className="ticker relative min-w-0 flex-1 overflow-hidden lg:max-w-lg">
          <div
            key={offset}
            className="ticker-track flex w-max"
            style={{ '--ticker-duration': durationFor(rotated.length) } as React.CSSProperties}
          >
            <HeadlineList posts={rotated} />
            <HeadlineList posts={rotated} decorative />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => step(-1)} aria-label="تیتر قبلی" className={arrowClass}>
            <ChevronIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="تیتر بعدی" className={arrowClass}>
            <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>

        <div className="hidden shrink-0 items-center gap-4 ps-2 text-xs lg:ms-auto lg:flex">
          {/* RSS is served by Django; the static demo has no such route. */}
          {!isStaticMode && (
            <a
              href="/feed/"
              className="press inline-flex items-center gap-1.5 whitespace-nowrap text-bone-300 transition-colors duration-150 hover:text-mint-300"
            >
              <RssIcon className="h-3.5 w-3.5" />
              دنبال کردن با خبرخوان
            </a>
          )}
          <span aria-hidden="true" className="h-4 w-px bg-ink-700" />
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-bone-400">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatJalaliDate(new Date().toISOString())}
          </span>
        </div>
      </div>
    </div>
  );
}
