// Collapsible SEO workspace for the post editor: meta fields with live counters,
// a Google-style SERP preview, a social card preview and a real-time checklist.
import { useState } from 'react';
import { SITE_NAME } from '../seo/Seo';
import { toPersianDigits } from '../../lib/format';
import { runSeoChecks, seoScore, type ContentStats, type SeoCheck } from '../../lib/seoChecks';
import { hint, input, label } from './panelStyles';

export interface SeoValues {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
}

interface SeoPanelProps {
  values: SeoValues;
  onChange: (patch: Partial<SeoValues>) => void;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categoryId: number | null;
  stats: ContentStats;
}

/** Character counter that turns green inside the recommended window. */
function Counter({ length, min, max }: { length: number; min: number; max: number }) {
  const tone =
    length === 0
      ? 'text-slate-400'
      : length >= min && length <= max
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400';
  // Spelled out rather than "54 / 50–60": a bare numeric range flips confusingly in RTL.
  return (
    <span className={`text-xs ${tone}`}>
      {toPersianDigits(length)} نویسه (پیشنهاد: {toPersianDigits(min)} تا {toPersianDigits(max)})
    </span>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function CheckRow({ check }: { check: SeoCheck }) {
  const marks = {
    pass: {
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      glyph: '✓',
      title: 'مناسب',
    },
    warn: {
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      glyph: '!',
      title: 'قابل بهبود',
    },
    fail: {
      className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      glyph: '×',
      title: 'نیازمند اصلاح',
    },
  }[check.status];

  return (
    <li className="flex items-start gap-3 py-2">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${marks.className}`}
      >
        {marks.glyph}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {check.label}
          <span className="sr-only"> — {marks.title}</span>
        </p>
        <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{check.detail}</p>
      </div>
    </li>
  );
}

export function SeoPanel({
  values,
  onChange,
  title,
  slug,
  excerpt,
  content,
  coverImage,
  categoryId,
  stats,
}: SeoPanelProps) {
  const [open, setOpen] = useState(true);

  const checks = runSeoChecks(
    {
      title,
      slug,
      excerpt,
      content,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      coverImage,
      categoryId,
    },
    stats,
  );
  const score = seoScore(checks);
  const problems = checks.filter((check) => check.status !== 'pass').length;

  // Same fallbacks the public article page uses (see Seo.tsx / ArticleDetailPage).
  const previewTitle = values.metaTitle.trim() || title.trim() || 'عنوان نوشته';
  const previewDescription =
    values.metaDescription.trim() || excerpt.trim() || 'توضیحی برای این نوشته ثبت نشده است.';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const previewUrl = values.canonicalUrl.trim() || `${origin}/articles/${slug || 'نامک-نوشته'}`;

  const scoreTone =
    score >= 80
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : score >= 50
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
      >
        <span className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            بهینه‌سازی موتور جستجو (SEO)
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreTone}`}>
            امتیاز {toPersianDigits(score)}٪
          </span>
          {problems > 0 && (
            <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
              {toPersianDigits(problems)} مورد قابل بررسی
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 9-7.5 7.5L4.5 9" />
        </svg>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-6 border-t border-slate-200 px-5 py-5 lg:grid-cols-2 dark:border-slate-800">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="seo-meta-title" className={label}>
                  عنوان متا
                </label>
                <Counter length={values.metaTitle.length} min={50} max={60} />
              </div>
              <input
                id="seo-meta-title"
                type="text"
                className={input}
                value={values.metaTitle}
                placeholder={title || 'در صورت خالی بودن، عنوان نوشته استفاده می‌شود'}
                onChange={(event) => onChange({ metaTitle: event.target.value })}
              />
              <p className={hint}>اگر خالی بماند، عنوان خود نوشته جایگزین می‌شود.</p>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="seo-meta-description" className={label}>
                  توضیحات متا
                </label>
                <Counter length={values.metaDescription.length} min={150} max={160} />
              </div>
              <textarea
                id="seo-meta-description"
                rows={3}
                className={input}
                value={values.metaDescription}
                placeholder={excerpt || 'در صورت خالی بودن، خلاصهٔ نوشته استفاده می‌شود'}
                onChange={(event) => onChange({ metaDescription: event.target.value })}
              />
              <p className={hint}>اگر خالی بماند، خلاصهٔ نوشته جایگزین می‌شود.</p>
            </div>

            <div>
              <label htmlFor="seo-keywords" className={label}>
                کلیدواژه‌ها
              </label>
              <input
                id="seo-keywords"
                type="text"
                className={input}
                value={values.metaKeywords}
                placeholder="مثلاً: جنگو، ری‌اکت، وبلاگ فارسی"
                onChange={(event) => onChange({ metaKeywords: event.target.value })}
              />
              <p className={hint}>کلیدواژه‌ها را با ویرگول از هم جدا کنید.</p>
            </div>

            <div>
              <label htmlFor="seo-canonical" className={label}>
                نشانی متعارف (canonical)
              </label>
              <input
                id="seo-canonical"
                type="url"
                dir="ltr"
                className={`${input} text-start`}
                value={values.canonicalUrl}
                placeholder={`${origin}/articles/${slug || 'slug'}`}
                onChange={(event) => onChange({ canonicalUrl: event.target.value })}
              />
              <p className={hint}>فقط در صورتی پر کنید که این محتوا جای دیگری هم منتشر شده است.</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                پیش‌نمایش نتیجهٔ جستجو
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p dir="ltr" className="truncate text-start text-xs text-emerald-700 dark:text-emerald-500">
                  {previewUrl}
                </p>
                <p className="mt-1 text-lg leading-7 text-[#1a0dab] dark:text-[#8ab4f8]">
                  {truncate(previewTitle, 60)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {truncate(previewDescription, 160)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                پیش‌نمایش کارت شبکه‌های اجتماعی
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt=""
                    className="h-40 w-full bg-slate-100 object-cover dark:bg-slate-800"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                    بدون تصویر شاخص
                  </div>
                )}
                <div className="bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <p dir="ltr" className="text-start text-[11px] uppercase text-slate-400">
                    {origin.replace(/^https?:\/\//, '') || 'example.com'}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                    {truncate(previewTitle, 70)} | {SITE_NAME}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {truncate(previewDescription, 120)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                سیاههٔ بررسی سئو
              </h3>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
