import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../lib/api';
import type { PostSummary } from '../lib/types';
import { SectionBar } from '../components/magazine/SectionBar';
import { ThumbRow } from '../components/magazine/ThumbRow';
import { NARROW, WIDE, outlinePill, solidPill } from '../components/magazine/tokens';
import { Seo } from '../components/seo/Seo';

/* Magazine 404: the display header pattern with the code standing in for the
   kicker, then the newest reads as a way back into the blog. */

export function NotFoundPage() {
  const [latest, setLatest] = useState<PostSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchPosts({ page: 1 })
      .then((data) => {
        if (!cancelled) setLatest(data.results.slice(0, 3));
      })
      .catch(() => {
        /* the way back is a bonus, never the reason this page fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Seo title="صفحه یافت نشد" noIndex />

      <section className="hero-wash">
        <div className={`${WIDE} pt-14 pb-10 text-center sm:pt-20`}>
          <p
            aria-hidden="true"
            className="rise text-[5rem] leading-none font-black tracking-tight text-ink-950 tabular-nums sm:text-[8rem] dark:text-bone-50"
          >
            ۴۰۴
          </p>

          <h1
            className="rise mx-auto mt-6 max-w-3xl text-[2.2rem] leading-[1.1] font-black tracking-tight text-ink-950 sm:text-[3rem] dark:text-bone-50"
            style={{ '--rise-delay': '60ms' } as React.CSSProperties}
          >
            این صفحه پیدا نشد
          </h1>

          <p
            className="rise mx-auto mt-4 max-w-xl text-sm text-ink-600 sm:text-base dark:text-bone-300"
            style={{ '--rise-delay': '120ms' } as React.CSSProperties}
          >
            نشانی وارد شده وجود ندارد یا جابه‌جا شده است.
          </p>

          <div
            className="rise mt-7 flex flex-wrap items-center justify-center gap-3"
            style={{ '--rise-delay': '180ms' } as React.CSSProperties}
          >
            <Link to="/" className={solidPill}>
              بازگشت به خانه
            </Link>
            <Link to="/articles" className={outlinePill}>
              دیدن مقالات
            </Link>
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section aria-labelledby="notfound-latest" className={`${NARROW} pt-4 pb-20`}>
          <div className="mx-auto max-w-2xl">
            <SectionBar id="notfound-latest" title="تازه‌ترین نوشته‌ها" note="شاید دنبال یکی از این‌ها بودید" />

            <div className="mt-4 grid gap-4">
              {latest.map((post) => (
                <ThumbRow key={post.id} post={post} mediaClass="h-full min-h-40" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
