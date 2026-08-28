function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-bone-300 dark:bg-ink-700 ${className}`} />;
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-bone-300 bg-bone-50 dark:border-ink-700 dark:bg-ink-900">
      <div className="bg-ink-950 p-1.5">
        <div className="h-44 w-full animate-pulse rounded-2xl bg-ink-800" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Pulse className="h-6 w-24" />
        <Pulse className="h-5 w-full" />
        <Pulse className="h-5 w-3/4" />
        <Pulse className="h-3 w-full" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Mirrors the article layout: title band, framed cover below it, then the text column. */
export function ArticleSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="border-b border-bone-300 dark:border-ink-800">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-14 sm:px-6">
          <Pulse className="h-4 w-40" />
          <Pulse className="mt-6 h-7 w-28" />
          <Pulse className="mt-5 h-10 w-full" />
          <Pulse className="mt-3 h-10 w-2/3" />
          <Pulse className="mt-6 h-4 w-56" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="-mt-8 rounded-3xl bg-ink-950 p-2">
          <div className="h-60 w-full animate-pulse rounded-2xl bg-ink-800 sm:h-80" />
        </div>
        <div className="mt-12 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Pulse key={index} className={index % 3 === 2 ? 'h-4 w-2/3' : 'h-4 w-full'} />
          ))}
        </div>
      </div>
    </div>
  );
}
