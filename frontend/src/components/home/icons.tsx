/** Line icons shared by the magazine home page. All decorative by default. */

type IconProps = { className?: string };

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Points along the reading direction (start to end), so it mirrors in RTL. */
export function ArrowIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2.2} {...stroke} className={`rtl:-scale-x-100 ${className}`} aria-hidden="true">
      <path d="M5 12h14m0 0-6-6m6 6-6 6" />
    </svg>
  );
}

export function ChevronIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2.4} {...stroke} className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function SearchIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} {...stroke} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function MailIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 7.1 4.7a2 2 0 0 0 2.2 0L20.5 8" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function RssIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1c6.627 0 12 5.373 12 12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1C20 10.611 13.389 4 4 4Zm0 8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 4 4 0 0 1 4 4 1 1 0 0 0 1 1h2a1 1 0 0 0 1-1c0-4.418-3.582-8-8-8Zm-1 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

/** Four-point sparkle, the reference's section glyph. */
export function SparkIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1.6c.62 5.6 3.18 8.18 10.4 10.4-7.22 2.22-9.78 4.8-10.4 10.4-.62-5.6-3.18-8.18-10.4-10.4C8.82 9.78 11.38 7.2 12 1.6Z" />
    </svg>
  );
}

export function BookmarkIcon({ filled, className = 'h-4 w-4' }: IconProps & { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 3.75h11a1.5 1.5 0 0 1 1.5 1.5v15l-7-4.2-7 4.2v-15a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  );
}

export function MenuIcon({ open, className = 'h-5 w-5' }: IconProps & { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} {...stroke} className={className} aria-hidden="true">
      {open ? <path d="M6 6 18 18M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}
