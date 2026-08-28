import { Link } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';

/* Radius system: anything pressable = rounded-full. */

export function NotFoundPage() {
  return (
    <section className="relative overflow-hidden">
      <Seo title="صفحه یافت نشد" noIndex />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40rem_20rem_at_50%_0%,var(--color-indigo-100),transparent_70%)] dark:bg-[radial-gradient(40rem_20rem_at_50%_0%,var(--color-indigo-950),transparent_70%)]"
      />

      <div className="mx-auto flex max-w-xl flex-col items-center px-4 pt-24 pb-28 text-center sm:px-6">
        <p
          aria-hidden="true"
          className="rise bg-gradient-to-l from-indigo-600 to-violet-500 bg-clip-text text-7xl font-extrabold text-transparent sm:text-8xl dark:from-indigo-400 dark:to-violet-300"
        >
          ۴۰۴
        </p>

        <h1
          className="rise mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white"
          style={{ '--rise-delay': '60ms' } as React.CSSProperties}
        >
          این صفحه پیدا نشد
        </h1>

        <p
          className="rise mt-4 leading-8 text-slate-600 dark:text-slate-400"
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
            className="press rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-indigo-700"
          >
            بازگشت به خانه
          </Link>
          <Link
            to="/articles"
            className="press rounded-full border border-slate-300 px-6 py-3 text-sm font-medium whitespace-nowrap text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
          >
            دیدن مقالات
          </Link>
        </div>
      </div>
    </section>
  );
}
