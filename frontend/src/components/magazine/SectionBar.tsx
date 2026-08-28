import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowIcon, SparkIcon } from '../home/icons';
import { cardShell } from './tokens';

/**
 * Section rule: a sparkle glyph and an h2 on one side, an optional arrow pill
 * on the other. One per section, and never two with the same destination on a
 * single page.
 */
export function SectionBar({
  id,
  title,
  note,
  action,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  action?: { to: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-7 ${cardShell}`}>
      <div className="flex items-center gap-3">
        <SparkIcon className="h-5 w-5 shrink-0 text-ink-950 dark:text-mint-300" />
        <h2 id={id} className="text-xl font-black tracking-tight text-ink-950 dark:text-bone-50">
          {title}
        </h2>
        {note && <p className="hidden text-xs text-ink-600 sm:block dark:text-bone-400">{note}</p>}
      </div>

      {action && (
        <Link
          to={action.to}
          className="press group inline-flex items-center gap-2.5 rounded-full text-sm font-bold text-ink-950 dark:text-bone-100"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-950 text-mint-300 transition-colors duration-150 group-hover:bg-mint-300 group-hover:text-ink-950 dark:bg-mint-300 dark:text-ink-950 dark:group-hover:bg-mint-400">
            <ArrowIcon />
          </span>
          {action.label}
        </Link>
      )}

      {children}
    </div>
  );
}
