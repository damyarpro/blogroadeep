function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <Pulse className="h-44 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Pulse className="h-4 w-20" />
        <Pulse className="h-5 w-full" />
        <Pulse className="h-5 w-3/4" />
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-2/3" />
        <div className="mt-auto flex justify-between pt-2">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-16" />
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

/** Mirrors the article layout: title band, cover breaking out of it, then the text column. */
export function ArticleSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-14 sm:px-6">
          <Pulse className="h-4 w-40" />
          <div className="mt-6 h-6 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <Pulse className="mt-4 h-9 w-full" />
          <Pulse className="mt-3 h-9 w-2/3" />
          <Pulse className="mt-6 h-4 w-56" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="-mt-8 h-60 w-full animate-pulse rounded-2xl bg-slate-200 sm:h-80 dark:bg-slate-800" />
        <div className="mt-12 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Pulse key={index} className={index % 3 === 2 ? 'h-4 w-2/3' : 'h-4 w-full'} />
          ))}
        </div>
      </div>
    </div>
  );
}
