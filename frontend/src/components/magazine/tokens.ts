/* ---------------------------------------------------------------------------
   Magazine design system: the class strings every public page shares.

   Radius lock: cards and panels = rounded-3xl, media inset in a frame =
   rounded-2xl, anything pressable = rounded-full.
   Palette: near-white paper, white cards with a soft border, near-black ink for
   type and strips, one mint accent. Dark mode inverts to a near-black page with
   ink-900 cards and the same mint.
   --------------------------------------------------------------------------- */

/** Full-bleed measure: masthead, hero and the featured photo row. */
export const WIDE = 'mx-auto w-full max-w-[88rem] px-4 sm:px-6';
/** Reading measure: everything below the featured row. */
export const NARROW = 'mx-auto w-full max-w-[62rem] px-4 sm:px-6';

/* One surface, two radii. Kept as separate strings rather than stacking
   `rounded-full` after `rounded-3xl`, so the shape never depends on which
   utility Tailwind happens to emit last. */
const surface =
  'border border-bone-300 bg-bone-50 shadow-[0_1px_2px_rgb(12_13_13/0.04),0_16px_34px_-26px_rgb(12_13_13/0.3)] dark:border-ink-800 dark:bg-ink-900 dark:shadow-none';

/** White card with a hairline border and a soft, low shadow. */
export const cardShell = `rounded-3xl ${surface}`;

/** The same surface at pill radius, for chips, badges and the search field. */
export const pillShell = `rounded-full ${surface}`;

/** Small category / tag pill used inside cards and meta rows. */
export const pillClass =
  'rounded-full bg-bone-200 px-3 py-1 text-[0.7rem] font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950';

/** Small circular arrow button that finishes a card. */
export const arrowChipClass =
  'press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bone-300 bg-bone-50 text-ink-950 transition-colors duration-150 hover:border-ink-950 hover:bg-ink-950 hover:text-mint-300 dark:border-ink-700 dark:bg-ink-900 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950';

/** Larger black circle, for page-level controls such as pagination. */
export const circleButtonClass =
  'press inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-950 text-mint-300 transition-colors duration-150 hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ink-400 disabled:ring-1 disabled:ring-bone-300 dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400 dark:disabled:bg-transparent dark:disabled:text-ink-400 dark:disabled:ring-ink-700';

/** Filter chip on a white card ground. Active reads as a solid ink pill. */
export function chipClass(active: boolean): string {
  return [
    'press inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition-colors duration-150',
    active
      ? 'border border-ink-950 bg-ink-950 text-mint-300 dark:border-mint-300 dark:bg-mint-300 dark:text-ink-950'
      : `text-ink-950 hover:border-ink-950 dark:text-bone-100 dark:hover:border-mint-300 ${pillShell}`,
  ].join(' ');
}

/** Count badge that rides inside a chip. */
export function chipCountClass(active: boolean): string {
  return [
    'rounded-full px-2 py-0.5 text-[0.7rem] font-normal',
    active
      ? 'bg-bone-50/15 text-mint-300 dark:bg-ink-950/15 dark:text-ink-950'
      : 'bg-bone-200 text-ink-600 dark:bg-ink-800 dark:text-bone-300',
  ].join(' ');
}

/** Primary action: a solid ink pill that flips to mint in the dark. */
export const solidPill =
  'press inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-bone-50 transition-colors duration-150 hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400';

/** Secondary action: outlined pill on the paper ground. */
export const outlinePill =
  'press inline-flex items-center justify-center gap-2 rounded-full border border-ink-950 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950';

/** Mint accent action, used once per page at most. */
export const mintPill =
  'press inline-flex items-center justify-center gap-2.5 rounded-full bg-mint-300 px-7 py-3.5 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-400';

/** Pill form field. Textareas add rounded-3xl instead of the pill radius. */
export const fieldClass =
  'w-full border border-bone-300 bg-bone-50 px-5 py-3 text-sm text-ink-950 outline-none transition-colors duration-150 placeholder:text-ink-400 focus:border-forest-800 focus:ring-2 focus:ring-mint-400/60 dark:border-ink-700 dark:bg-ink-950 dark:text-bone-50 dark:focus:border-mint-300';

export const fieldLabelClass = 'mb-2 block text-sm font-bold text-ink-950 dark:text-bone-100';

/** Muted body copy, the one grey used for excerpts and meta text. */
export const mutedText = 'text-ink-600 dark:text-bone-300';
