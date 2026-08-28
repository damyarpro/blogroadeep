export function ErrorState({
  message = 'مشکلی در دریافت اطلاعات پیش آمد.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-ink-950 px-6 py-12 text-center dark:bg-ink-900"
    >
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-300 text-ink-950">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v4.5m0 3.5h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>

      <div>
        <p className="text-lg font-black tracking-tight text-bone-50">دریافت اطلاعات ممکن نشد</p>
        <p className="mt-2 text-sm leading-7 text-bone-300">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="press rounded-full bg-mint-300 px-6 py-2.5 text-sm font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-mint-400"
        >
          تلاش دوباره
        </button>
      )}
    </div>
  );
}
