import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchCategories, fetchTags, isStaticMode, ApiError } from '../lib/api';
import type { Category, PostSummary, Tag } from '../lib/types';
import { CoverImage } from '../components/cards/CoverImage';
import { BookmarkButton } from '../components/home/BookmarkButton';
import { ArrowIcon, MailIcon, RssIcon, SparkIcon } from '../components/home/icons';
import { ErrorState } from '../components/common/ErrorState';
import { Seo } from '../components/seo/Seo';
import { AuthorRow } from '../components/magazine/Meta';
import { PageHeader } from '../components/magazine/PageHeader';
import { PhotoCard, PhotoCardSkeleton } from '../components/magazine/PhotoCard';
import { SectionBar } from '../components/magazine/SectionBar';
import { ThumbRow } from '../components/magazine/ThumbRow';
import { NARROW, WIDE, arrowChipClass, cardShell, chipClass, chipCountClass, pillClass } from '../components/magazine/tokens';
import { formatReadingTime, toPersianDigits } from '../lib/format';

/* Magazine home page, built from the shared pieces in components/magazine.
   Two column widths on purpose: the masthead, hero and featured trio run wide,
   everything below sits in a narrower reading column. */

/** Bento hero: one tall photograph with the headline floated over its foot. */
function BentoLead({ post }: { post: PostSummary }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-ink-900">
      <Link to={`/articles/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block">
        <CoverImage
          src={post.cover_image}
          alt=""
          seed={post.slug}
          photo="1200/900"
          className="h-80 w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.03] lg:h-[27rem]"
        />
      </Link>

      <div className="glass absolute bottom-4 start-4 max-w-[85%] rounded-3xl border border-bone-50/60 p-5 shadow-[0_20px_45px_-28px_rgb(12_13_13/0.55)] lg:max-w-[72%] dark:border-ink-700/60">
        {post.category && (
          <Link to={`/articles?category=${post.category.slug}`} className={`press ${pillClass}`}>
            {post.category.name}
          </Link>
        )}
        <h3 className="mt-3 text-2xl leading-tight font-black tracking-tight text-ink-950 sm:text-[1.75rem] dark:text-bone-50">
          <Link to={`/articles/${post.slug}`} className="line-clamp-2 hover:underline underline-offset-4">
            {post.title}
          </Link>
        </h3>
        <AuthorRow post={post} className="mt-4 text-ink-600 dark:text-bone-300" />
      </div>

      <Link
        to={`/articles/${post.slug}`}
        aria-label={`خواندن «${post.title}»`}
        className={`${arrowChipClass} absolute end-4 bottom-4`}
      >
        <ArrowIcon />
      </Link>
    </article>
  );
}

/** Wide editorial card: pills, headline, photograph, excerpt, byline. */
function WideCard({ post }: { post: PostSummary }) {
  const readingTime = formatReadingTime(post.reading_time);

  return (
    <article className={`group flex flex-col p-5 sm:p-6 ${cardShell}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.7rem] text-ink-600 dark:text-bone-300">
          {post.category && (
            <Link to={`/articles?category=${post.category.slug}`} className={`press ${pillClass}`}>
              {post.category.name}
            </Link>
          )}
          {post.tags.slice(0, 1).map((tag) => (
            <Link key={tag.slug} to={`/articles?tag=${tag.slug}`} className={`press ${pillClass}`}>
              {tag.name}
            </Link>
          ))}
          {readingTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readingTime}</span>
            </>
          )}
        </div>
        <BookmarkButton slug={post.slug} title={post.title} tone="plain" />
      </div>

      <h3 className="mt-4 min-h-[4rem] text-2xl leading-tight font-black tracking-tight text-ink-950 dark:text-bone-50">
        <Link to={`/articles/${post.slug}`} className="line-clamp-2 hover:underline underline-offset-4">
          {post.title}
        </Link>
      </h3>

      <Link
        to={`/articles/${post.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="mt-5 block overflow-hidden rounded-2xl bg-ink-900"
      >
        <CoverImage
          src={post.cover_image}
          alt=""
          seed={`${post.slug}-wide`}
          photo="900/560"
          className="h-52 w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.04]"
        />
      </Link>

      <p className="mt-5 line-clamp-3 text-sm leading-7 text-ink-600 dark:text-bone-300">{post.excerpt}</p>

      <div className="mt-5 flex items-end justify-between gap-3 pt-1">
        <AuthorRow post={post} className="text-ink-600 dark:text-bone-300" />
        <Link to={`/articles/${post.slug}`} aria-label={`خواندن «${post.title}»`} className={arrowChipClass}>
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-bone-300 dark:bg-ink-800 ${className}`} />;
}

/** Skeleton shaped like the real page: trio, then bento, then the wide pair. */
function HomeSkeleton() {
  return (
    <div aria-hidden="true">
      <section className={`${WIDE} pt-4`}>
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className={`${NARROW} pt-14`}>
        <div className="grid gap-4 lg:grid-cols-[1.42fr_1fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-bone-300 lg:h-[27rem] dark:bg-ink-800" />
          <div className="grid gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div className="h-44 animate-pulse rounded-3xl bg-bone-300 lg:h-[13rem] dark:bg-ink-800" />
                <div className={`space-y-3 p-4 ${cardShell}`}>
                  <Pulse className="h-5 w-24" />
                  <Pulse className="h-4 w-full" />
                  <Pulse className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPosts({ page: 1 })
      .then((data) => {
        if (!cancelled) setPosts(data.results);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'خطای غیرمنتظره‌ای رخ داد.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Taxonomy is secondary: a failure here must not take the page down with it.
  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {});
    fetchTags()
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const list = posts ?? [];
  /* Eight photo slots, and a young blog may hold fewer posts than that. Walking
     the list with a wrapping index fills every slot without leaving a hole. */
  const slot = (index: number): PostSummary | null =>
    list.length === 0 ? null : list[index % list.length];
  const take = (from: number, count: number): PostSummary[] =>
    Array.from({ length: count }, (_, i) => slot(from + i)).filter((p): p is PostSummary => p !== null);

  const featured = take(0, 3);
  const bentoLead = slot(3);
  const bentoRows = take(4, 2);
  const wide = take(6, 2);

  const hasPosts = list.length > 0;
  const scrollerItems = [
    ...categories.map((c) => ({ key: `c-${c.slug}`, to: `/articles?category=${c.slug}`, name: c.name, count: c.post_count })),
    ...tags.map((t) => ({ key: `t-${t.slug}`, to: `/articles?tag=${t.slug}`, name: t.name, count: t.post_count })),
  ];

  return (
    <>
      <Seo
        title="بلاگ رودیپ"
        description="بلاگ رودیپ؛ مقالات، یادداشت‌ها و تحلیل‌های تازه به زبان فارسی درباره فناوری، توسعه نرم‌افزار و ایده‌های نو."
        canonicalPath="/"
      />

      {/* Section 1 of 6: centred display headline over a soft accent wash. */}
      <PageHeader
        size="display"
        title="دروازهٔ شما به دنیای فناوری"
        subtitle="تازه‌ترین نوشته‌ها دربارهٔ ساختن، طراحی و نرم‌افزار، به زبان فارسی."
      />

      {loading && <HomeSkeleton />}

      {!loading && error && (
        <section className={`${NARROW} py-16`}>
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </section>
      )}

      {!loading && !error && !hasPosts && (
        <section className={`${NARROW} py-20`}>
          <div className={`p-10 text-center ${cardShell}`}>
            <p className="text-lg font-bold text-ink-950 dark:text-bone-50">هنوز نوشته‌ای منتشر نشده است.</p>
            <p className="mt-3 text-sm text-ink-600 dark:text-bone-300">
              به زودی اولین مقاله‌ها اینجا منتشر می‌شوند.
            </p>
          </div>
        </section>
      )}

      {!loading && !error && hasPosts && (
        <>
          {/* Section 2 of 6: three photo cards, each with a glass caption panel. */}
          <section className={`${WIDE} pt-2`} aria-label="نوشته‌های برگزیده">
            <div className="grid gap-5 md:grid-cols-3">
              {featured.map((post, index) => (
                <div
                  key={`featured-${post.slug}`}
                  className="rise h-full"
                  style={{ '--rise-delay': `${index * 70}ms` } as React.CSSProperties}
                >
                  <PhotoCard post={post} eager={index === 0} />
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 of 6: a scrolling rail of every subject on the blog. */}
          {scrollerItems.length > 0 && (
            <nav aria-label="موضوع‌ها" className="mt-24">
              <ul className={`snap-row ${WIDE} flex gap-3 overflow-x-auto py-5`}>
                {scrollerItems.map((item) => (
                  <li key={item.key} className="shrink-0">
                    <Link to={item.to} className={chipClass(false)}>
                      {item.name}
                      <span className={chipCountClass(false)}>{toPersianDigits(item.count)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Section 4 of 6: the section bar, then the magazine bento under it. */}
          <section className={`${NARROW} pt-24`}>
            <SectionBar
              title="آخرین نوشته‌ها"
              note="تازه‌ترین‌ها، دست اول"
              action={{ to: '/articles', label: 'مشاهدهٔ همه' }}
            />

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.42fr_1fr]">
              {bentoLead && <BentoLead post={bentoLead} />}
              <div className="grid gap-4">
                {bentoRows.map((post) => (
                  <ThumbRow key={`bento-${post.slug}`} post={post} />
                ))}
              </div>
            </div>
          </section>

          {/* Section 5 of 6: two wide reads, side by side. */}
          {wide.length > 0 && (
            <section className={`${NARROW} pt-5`} aria-label="خواندنی‌های بیشتر">
              <div className="grid gap-4 md:grid-cols-2">
                {wide.map((post) => (
                  <WideCard key={`wide-${post.slug}`} post={post} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Section 6 of 6: follow band. No newsletter backend exists, so the offer
          is the blog's real RSS feed, plus the full subject list beside it. */}
      <section className={`${NARROW} pt-20 pb-16`}>
        <div className="grid gap-4 md:grid-cols-[1.55fr_1fr]">
          <div className={`relative overflow-hidden p-7 sm:p-9 ${cardShell}`}>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 end-0 h-24 w-48 text-bone-300 dark:text-ink-800"
              viewBox="0 0 192 96"
            >
              <defs>
                <pattern id="homeDots" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="1.6" cy="1.6" r="1.6" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="192" height="96" fill="url(#homeDots)" />
            </svg>

            <p className="relative flex items-center gap-2 text-xs font-bold text-ink-600 dark:text-bone-300">
              <MailIcon className="h-4 w-4" />
              خبرنامه
            </p>

            <h2 className="relative mt-4 max-w-md text-2xl leading-snug font-black tracking-tight text-ink-950 sm:text-[1.75rem] dark:text-bone-50">
              نوشته‌های تازه را هر هفته زودتر از بقیه بخوانید
            </h2>

            <p className="relative mt-4 max-w-md text-sm leading-7 text-ink-600 dark:text-bone-300">
              {isStaticMode
                ? 'در نسخهٔ نمایشی خبرخوان در دسترس نیست؛ نسخهٔ کامل با بک‌اند جنگو فید RSS دارد.'
                : 'نشانی فید را در خبرخوان دلخواهتان بگذارید تا هر نوشتهٔ تازه همان‌جا برسد.'}
            </p>

            {!isStaticMode && (
              <a
                href="/feed/"
                className="press relative mt-7 inline-flex items-center gap-2.5 rounded-full bg-mint-300 py-3 ps-6 pe-3 text-sm font-bold text-ink-950 transition-colors duration-150 hover:bg-mint-400"
              >
                دنبال کردن با خبرخوان
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 text-mint-300">
                  <RssIcon className="h-4 w-4" />
                </span>
              </a>
            )}
          </div>

          <div className={`relative p-6 ${cardShell}`}>
            <SparkIcon className="absolute end-5 top-5 h-5 w-5 text-ink-950 dark:text-mint-300" />
            <h2 className="text-xs font-bold text-ink-600 dark:text-bone-300">موضوع‌های بلاگ</h2>

            <ul className="mt-5 grid grid-cols-2 gap-2">
              {tags.slice(0, 6).map((tag) => (
                <li key={tag.slug}>
                  <Link
                    to={`/articles?tag=${tag.slug}`}
                    className="press flex h-14 items-center justify-center gap-2 rounded-2xl bg-ink-950 px-2 text-center text-xs font-bold text-bone-50 transition-colors duration-150 hover:bg-forest-800 dark:bg-ink-800 dark:hover:bg-forest-800"
                  >
                    {tag.name}
                    <span className="text-[0.65rem] font-normal text-mint-300">{toPersianDigits(tag.post_count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
