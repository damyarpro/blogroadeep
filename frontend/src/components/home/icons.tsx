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

/* Share glyphs. Simple functional marks, drawn here so the page pulls no icon
   font or third-party asset. Each button carries its own visible-to-AT label. */

export function TelegramIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.6 4.3 2.9 11.5c-.9.3-.9 1.6.1 1.9l4.6 1.4 1.8 5.4c.3.8 1.3 1 1.9.4l2.6-2.5 4.6 3.4c.7.5 1.6.1 1.8-.7l3-14.6c.2-.9-.7-1.6-1.7-1.2Zm-3 3.4-7.8 7c-.3.2-.4.5-.5.9l-.3 2.2-1.2-3.7 9.3-6.9c.4-.3.9.2.5.5Z" />
    </svg>
  );
}

export function XIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.2 3h3.3l-7.2 8.3L21.8 21h-6.6l-5.2-6.5L4.1 21H.8l7.7-8.8L.4 3h6.8l4.7 6 5.3-6Zm-1.2 16h1.8L7.9 4.9H6l10 14.1Z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.5-5.9c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.6 4c1.5.6 2.1.7 2.8.6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2Z" />
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
