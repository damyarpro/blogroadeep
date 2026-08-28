function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-bone-300 dark:bg-ink-700 ${className}`} />;
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-bone-300 bg-bone-50 dark:border-ink-700 dark:bg-ink-900">
      <div className="bg-ink-950 p-2">
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

/** Mirrors the article layout: ink title board, then the bone reading board. */
export function ArticleSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <div className="rounded-[2rem] bg-ink-950 p-6 sm:p-10 lg:p-12 dark:bg-ink-900">
          <div className="h-4 w-40 animate-pulse rounded-full bg-ink-800" />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="h-7 w-28 animate-pulse rounded-full bg-ink-800" />
              <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-ink-800" />
              <div className="mt-3 h-11 w-2/3 animate-pulse rounded-full bg-ink-800" />
              <div className="mt-7 h-4 w-56 animate-pulse rounded-full bg-ink-800" />
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-ink-900 p-2 dark:bg-ink-950">
                <div className="h-52 w-full animate-pulse rounded-2xl bg-ink-800 sm:h-64" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-5 pb-20 sm:px-6">
        <div className="rounded-[2rem] border border-bone-300 bg-bone-50 px-5 py-10 sm:px-10 sm:py-14 dark:border-ink-700 dark:bg-ink-900">
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
