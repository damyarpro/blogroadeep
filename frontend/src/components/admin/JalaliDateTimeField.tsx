// Jalali (Persian calendar) date + time picker for the post editor's publish
// date. Displays and edits in Jalali (react-multi-date-picker + persian_fa
// locale) while the value it reads/emits stays an ISO 8601 string — the exact
// shape the API already expects — so nothing else in the payload changes.
import { useMemo } from 'react';
import RawDatePicker, { type Value } from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import RawTimePicker from 'react-multi-date-picker/plugins/time_picker';

// Vite's dev-time CJS→ESM interop (esbuild) doesn't unwrap these two modules'
// nested `.default` the way Rollup's production build does — grab whichever
// shape is actually the component so both `npm run dev` and `npm run build`
// render the real component instead of the raw module namespace object.
const DatePicker = (RawDatePicker as unknown as { default?: typeof RawDatePicker }).default ?? RawDatePicker;
const TimePicker = (RawTimePicker as unknown as { default?: typeof RawTimePicker }).default ?? RawTimePicker;

interface JalaliDateTimeFieldProps {
  id?: string;
  /** ISO 8601 string, or '' when unset. */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
}

export function JalaliDateTimeField({ id, value, onChange, placeholder }: JalaliDateTimeFieldProps) {
  const dateValue = useMemo<Value>(() => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new DateObject({ date: parsed, calendar: persian, locale: persian_fa });
  }, [value]);

  return (
    <div className="jalali-field" dir="rtl">
      <DatePicker
        id={id}
        value={dateValue}
        onChange={(selected) => {
          if (!selected || Array.isArray(selected)) {
            onChange('');
            return;
          }
          onChange(selected.toDate().toISOString());
        }}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD HH:mm"
        editable={false}
        calendarPosition="bottom-right"
        inputClass="jalali-field-input"
        className="jalali-panel"
        placeholder={placeholder}
        plugins={[<TimePicker key="time" hideSeconds position="bottom" />]}
      />
    </div>
  );
}
