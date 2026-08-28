import { Link } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';

/* Radius system: block surfaces = rounded-3xl, anything pressable = rounded-full. */

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 pt-20 pb-28 text-center sm:px-6">
      <Seo title="صفحه یافت نشد" noIndex />

      <p
        aria-hidden="true"
        className="rise rounded-3xl bg-mint-300 px-10 py-6 text-7xl font-black tracking-tight text-ink-950 tabular-nums sm:px-14 sm:text-8xl"
      >
        ۴۰۴
      </p>

      <h1
        className="rise mt-9 text-3xl font-black tracking-tight text-ink-950 sm:text-4xl dark:text-bone-50"
        style={{ '--rise-delay': '60ms' } as React.CSSProperties}
      >
        این صفحه پیدا نشد
      </h1>

      <p
        className="rise mt-4 leading-8 text-ink-600 dark:text-bone-300"
        style={{ '--rise-delay': '120ms' } as React.CSSProperties}
      >
        نشانی وارد شده وجود ندارد یا جابه‌جا شده است.
      </p>

      <div
        className="rise mt-9 flex flex-wrap items-center justify-center gap-3"
        style={{ '--rise-delay': '180ms' } as React.CSSProperties}
      >
        <Link
          to="/"
          className="press rounded-full bg-ink-950 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-bone-50 transition-colors duration-150 hover:bg-forest-800 dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400"
        >
          بازگشت به خانه
        </Link>
        <Link
          to="/articles"
          className="press rounded-full border border-ink-950 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950"
        >
          دیدن مقالات
        </Link>
      </div>
    </section>
  );
}
