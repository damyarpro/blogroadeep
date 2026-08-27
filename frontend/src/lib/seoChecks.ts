// Real-time SEO audit for the post editor. Pure functions so the editor screen
// can re-run them on every keystroke without side effects.
import { toPersianDigits as fa } from './format';

export type SeoCheckStatus = 'pass' | 'warn' | 'fail';

export interface SeoCheck {
  id: string;
  label: string;
  status: SeoCheckStatus;
  detail: string;
}

export interface SeoCheckInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  coverImage: string | null;
  categoryId: number | null;
}

export interface ContentStats {
  words: number;
  characters: number;
  headings: number;
  images: number;
  imagesMissingAlt: number;
  readingTime: number;
}

const WORDS_PER_MINUTE = 200;

/** Parse the authored HTML once and pull out everything the checks need. */
export function analyzeContent(html: string): ContentStats {
  const empty: ContentStats = {
    words: 0,
    characters: 0,
    headings: 0,
    images: 0,
    imagesMissingAlt: 0,
    readingTime: 0,
  };
  if (!html || typeof DOMParser === 'undefined') return empty;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  } catch {
    return empty;
  }

  const text = doc.body.textContent ?? '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const images = Array.from(doc.querySelectorAll('img'));

  return {
    words,
    characters: text.length,
    headings: doc.querySelectorAll('h2').length,
    images: images.length,
    imagesMissingAlt: images.filter((img) => !(img.getAttribute('alt') ?? '').trim()).length,
    readingTime: words ? Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) : 0,
  };
}

/** Latin letters, digits, Persian/Arabic letters and hyphens only. */
export function isUrlSafeSlug(slug: string): boolean {
  return /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug) && !/\s/.test(slug);
}

export function runSeoChecks(input: SeoCheckInput, stats: ContentStats): SeoCheck[] {
  const effectiveTitle = input.metaTitle.trim() || input.title.trim();
  const effectiveDescription = input.metaDescription.trim() || input.excerpt.trim();
  const checks: SeoCheck[] = [];

  const titleLength = effectiveTitle.length;
  checks.push({
    id: 'title-length',
    label: 'طول عنوان سئو',
    status: titleLength === 0 ? 'fail' : titleLength >= 50 && titleLength <= 60 ? 'pass' : 'warn',
    detail:
      titleLength === 0
        ? 'عنوانی ثبت نشده است.'
        : `${fa(titleLength)} نویسه — بازهٔ پیشنهادی ۵۰ تا ۶۰ نویسه است.`,
  });

  const descriptionLength = effectiveDescription.length;
  checks.push({
    id: 'description-length',
    label: 'طول توضیحات متا',
    status:
      descriptionLength === 0
        ? 'fail'
        : descriptionLength >= 150 && descriptionLength <= 160
          ? 'pass'
          : 'warn',
    detail:
      descriptionLength === 0
        ? 'توضیحات متا و خلاصه هر دو خالی‌اند.'
        : `${fa(descriptionLength)} نویسه — بازهٔ پیشنهادی ۱۵۰ تا ۱۶۰ نویسه است.`,
  });

  checks.push({
    id: 'excerpt',
    label: 'خلاصهٔ نوشته',
    status: input.excerpt.trim() ? 'pass' : 'warn',
    detail: input.excerpt.trim()
      ? 'خلاصه ثبت شده و در کارت‌ها و شبکه‌های اجتماعی استفاده می‌شود.'
      : 'خلاصه خالی است؛ در فهرست مقالات و اشتراک‌گذاری دیده می‌شود.',
  });

  checks.push({
    id: 'cover-image',
    label: 'تصویر شاخص',
    status: input.coverImage ? 'pass' : 'warn',
    detail: input.coverImage
      ? 'تصویر شاخص برای کارت شبکه‌های اجتماعی موجود است.'
      : 'بدون تصویر شاخص، کارت اشتراک‌گذاری ساده نمایش داده می‌شود.',
  });

  checks.push({
    id: 'content-length',
    label: 'حجم محتوا',
    status: stats.words === 0 ? 'fail' : stats.words >= 300 ? 'pass' : 'warn',
    detail:
      stats.words === 0
        ? 'متن نوشته خالی است.'
        : `${fa(stats.words)} واژه (حدود ${fa(stats.readingTime)} دقیقه مطالعه) — حداقل ۳۰۰ واژه پیشنهاد می‌شود.`,
  });

  checks.push({
    id: 'headings',
    label: 'ساختار سرتیترها',
    status: stats.headings > 0 ? 'pass' : 'warn',
    detail:
      stats.headings > 0
        ? `${fa(stats.headings)} سرتیتر H2 در متن وجود دارد.`
        : 'حداقل یک سرتیتر H2 به متن اضافه کنید.',
  });

  checks.push({
    id: 'image-alt',
    label: 'متن جایگزین تصاویر',
    status: stats.imagesMissingAlt === 0 ? 'pass' : 'fail',
    detail:
      stats.images === 0
        ? 'تصویری در متن نیست.'
        : stats.imagesMissingAlt === 0
          ? `همهٔ ${fa(stats.images)} تصویر متن جایگزین دارند.`
          : `${fa(stats.imagesMissingAlt)} تصویر بدون متن جایگزین است.`,
  });

  checks.push({
    id: 'category',
    label: 'دسته‌بندی',
    status: input.categoryId ? 'pass' : 'warn',
    detail: input.categoryId
      ? 'نوشته در یک دسته‌بندی قرار گرفته است.'
      : 'انتخاب دسته‌بندی به پیمایش و لینک‌سازی داخلی کمک می‌کند.',
  });

  const slug = input.slug.trim();
  checks.push({
    id: 'slug',
    label: 'نامک نشانی',
    status: !slug ? 'fail' : isUrlSafeSlug(slug) ? 'pass' : 'warn',
    detail: !slug
      ? 'نامک خالی است.'
      : isUrlSafeSlug(slug)
        ? 'نامک برای نشانی وب معتبر است.'
        : 'نامک نباید فاصله یا نویسهٔ خاص داشته باشد؛ از خط تیره استفاده کنید.',
  });

  return checks;
}

export function seoScore(checks: SeoCheck[]): number {
  if (checks.length === 0) return 0;
  const points = checks.reduce(
    (total, check) => total + (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0),
    0,
  );
  return Math.round((points / checks.length) * 100);
}
