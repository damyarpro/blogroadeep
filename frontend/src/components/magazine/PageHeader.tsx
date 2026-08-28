import type { ReactNode } from 'react';
import { WIDE } from './tokens';

/**
 * The centred display header every public page opens with: one h1 over the soft
 * accent wash, a single line of subtext beneath it, and room for one badge or
 * control row underneath. `size="display"` is the home page's larger scale.
 */
export function PageHeader({
  title,
  subtitle,
  size = 'page',
  children,
}: {
  title: string;
  subtitle: string;
  size?: 'display' | 'page';
  children?: ReactNode;
}) {
  const titleScale =
    size === 'display'
      ? 'text-[2.4rem] sm:text-[3.4rem] lg:text-[4rem]'
      : 'text-[2.2rem] sm:text-[3rem] lg:text-[3.25rem]';

  return (
    <section className="hero-wash">
      <div className={`${WIDE} pt-14 pb-10 text-center sm:pt-20`}>
        <h1
          className={`rise mx-auto max-w-3xl leading-[1.1] font-black tracking-tight text-ink-950 dark:text-bone-50 ${titleScale}`}
          style={{ '--rise-delay': '0ms' } as React.CSSProperties}
        >
          {title}
        </h1>
        <p
          className="rise mx-auto mt-4 max-w-xl text-sm text-ink-600 sm:text-base dark:text-bone-300"
          style={{ '--rise-delay': '80ms' } as React.CSSProperties}
        >
          {subtitle}
        </p>
        {children && (
          <div
            className="rise mt-7 flex flex-wrap items-center justify-center gap-3"
            style={{ '--rise-delay': '140ms' } as React.CSSProperties}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
