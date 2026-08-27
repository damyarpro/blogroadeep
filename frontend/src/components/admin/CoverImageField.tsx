import { useRef } from 'react';
import { dangerButton, label, secondaryButton } from './panelStyles';

interface CoverImageFieldProps {
  /** Blob URL of a freshly picked file, or the URL stored on the server. */
  preview: string | null;
  /** Name of the not-yet-uploaded file, if one is pending. */
  fileName: string | null;
  onPick: (file: File | null) => void;
  onRemove: () => void;
}

export function CoverImageField({ preview, fileName, onPick, onRemove }: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <span className={label}>تصویر شاخص</span>

      {preview ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <img src={preview} alt="پیش‌نمایش تصویر شاخص" className="h-44 w-full object-cover" />
          <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 dark:bg-slate-900">
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
              {fileName ?? 'تصویر ذخیره‌شده'}
            </span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`${secondaryButton} px-3 py-1 text-xs`}
              >
                تغییر
              </button>
              <button
                type="button"
                onClick={() => {
                  onPick(null);
                  onRemove();
                }}
                className={`${dangerButton} px-3 py-1 text-xs`}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-600"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-7 w-7">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5 8.25 11l4.5 4.5 2.25-2.25L21 19M3 5.25h18v13.5H3V5.25Z"
            />
          </svg>
          انتخاب تصویر شاخص
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0] ?? null;
          event.target.value = '';
          onPick(picked);
        }}
      />
    </div>
  );
}
