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

export function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10" aria-hidden="true">
      <Pulse className="mb-4 h-4 w-24" />
      <Pulse className="mb-3 h-9 w-full" />
      <Pulse className="mb-6 h-9 w-2/3" />
      <Pulse className="mb-8 h-64 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Pulse key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
