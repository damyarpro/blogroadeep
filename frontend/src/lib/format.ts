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
  // Handles both ASCII 0-9 and Arabic-Indic ٠-٩ (e.g. pasted from Arabic text).
  return String(value).replace(/[0-9٠-٩]/g, (d) => {
    const code = d.charCodeAt(0);
    return digits[code >= 0x0660 ? code - 0x0660 : code - 0x30];
  });
}
