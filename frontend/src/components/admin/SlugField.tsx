import { useEffect, useState } from 'react';
import { checkSlugAvailability } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { hint, input, label } from './panelStyles';

interface SlugFieldProps {
  value: string;
  /** False while the slug is still auto-derived from the title. */
  touched: boolean;
  excludeId?: number;
  errors?: string[];
  onChange: (slug: string) => void;
  onReset: () => void;
}

type Availability =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'taken' }
  | { state: 'invalid'; detail: string };

export function SlugField({
  value,
  touched,
  excludeId,
  errors,
  onChange,
  onReset,
}: SlugFieldProps) {
  const [availability, setAvailability] = useState<Availability>({ state: 'idle' });
  const debounced = useDebouncedValue(value.trim(), 500);

  useEffect(() => {
    if (!debounced) {
      setAvailability({ state: 'idle' });
      return;
    }
    let cancelled = false;
    setAvailability({ state: 'checking' });
    checkSlugAvailability(debounced, excludeId)
      .then((result) => {
        if (cancelled) return;
        if (result.detail) {
          setAvailability({ state: 'invalid', detail: result.detail });
        } else {
          setAvailability({ state: result.available ? 'available' : 'taken' });
        }
      })
      .catch(() => {
        if (!cancelled) setAvailability({ state: 'idle' });
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, excludeId]);

  const message: Record<Availability['state'], { text: string; tone: string }> = {
    idle: { text: 'نامک از روی عنوان ساخته می‌شود.', tone: 'text-slate-500 dark:text-slate-400' },
    checking: { text: 'در حال بررسی…', tone: 'text-slate-500 dark:text-slate-400' },
    available: { text: 'این نامک آزاد است.', tone: 'text-emerald-600 dark:text-emerald-400' },
    taken: {
      text: 'این نامک قبلاً استفاده شده است.',
      tone: 'text-rose-600 dark:text-rose-400',
    },
    invalid: { text: 'نامک معتبر نیست.', tone: 'text-rose-600 dark:text-rose-400' },
  };
  const status = message[availability.state];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="post-slug" className={label}>
          نامک (بخش پایانی نشانی)
        </label>
        {touched && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ساخت خودکار از عنوان
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-slate-400" dir="ltr">
          /articles/
        </span>
        <input
          id="post-slug"
          type="text"
          className={input}
          value={value}
          placeholder="نامک-نوشته"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <p className={`${hint} ${status.tone}`}>{status.text}</p>
      {errors && (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.join(' ')}</p>
      )}
    </div>
  );
}
