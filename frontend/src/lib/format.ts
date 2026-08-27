// Formatting helpers for Persian (fa-IR) locale display.

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatJalaliDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
}

export function formatJalaliDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return dateTimeFormatter.format(date);
}

const readingTimeFormatter = new Intl.NumberFormat('fa-IR');

export function formatReadingTime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';
  return `${readingTimeFormatter.format(Math.max(1, Math.round(minutes)))} دقیقه مطالعه`;
}

export function toPersianDigits(value: string | number): string {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(value).replace(/[0-9]/g, (d) => digits[Number(d)]);
}
