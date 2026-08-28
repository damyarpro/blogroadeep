import { NARROW, cardShell } from '../magazine/tokens';

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-bone-300 dark:bg-ink-800 ${className}`} />;
}

/** Mirrors the article layout: centred header, full-width cover, reading card. */
export function ArticleSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hero-wash">
        <div className={`${NARROW} flex flex-col items-center pt-10 pb-9 sm:pt-14`}>
          <Pulse className="h-3 w-32" />
          <Pulse className="mt-6 h-8 w-28" />
          <Pulse className="mt-6 h-10 w-full max-w-2xl" />
          <Pulse className="mt-3 h-10 w-2/3 max-w-lg" />
          <Pulse className="mt-7 h-7 w-64" />
        </div>
      </div>

      <div className={NARROW}>
        <div className="h-56 w-full animate-pulse rounded-3xl bg-bone-300 sm:h-80 lg:h-[26rem] dark:bg-ink-800" />

        <div className={`mt-5 px-5 py-10 sm:px-10 sm:py-14 ${cardShell}`}>
          <div className="mx-auto max-w-2xl space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Pulse key={index} className={index % 3 === 2 ? 'h-4 w-2/3' : 'h-4 w-full'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
