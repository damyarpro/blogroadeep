// Jalali (Persian calendar) date + time picker for the post editor's publish
// date. Displays and edits in Jalali (react-multi-date-picker + persian_fa
// locale) while the value it reads/emits stays an ISO 8601 string — the exact
// shape the API already expects — so nothing else in the payload changes.
import { useMemo } from 'react';
import DatePicker, { type Value } from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';

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
