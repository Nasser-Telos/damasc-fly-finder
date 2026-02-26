import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { format, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ARABIC_MONTHS } from "@/lib/booking-constants";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "اختر التاريخ",
  error,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  // Month/year navigation state
  const [viewMonth, setViewMonth] = useState<Date>(
    selectedDate || new Date()
  );

  useEffect(() => {
    if (value) {
      const parsed = parse(value, "yyyy-MM-dd", new Date());
      setViewMonth(parsed);
    }
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  const minYear = minDate ? minDate.getFullYear() : 1930;
  const maxYear = maxDate ? maxDate.getFullYear() : 2040;
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  const handleMonthChange = (monthIdx: number) => {
    const next = new Date(viewMonth);
    next.setMonth(monthIdx);
    setViewMonth(next);
  };

  const handleYearChange = (year: number) => {
    const next = new Date(viewMonth);
    next.setFullYear(year);
    setViewMonth(next);
  };

  const displayText = selectedDate
    ? format(selectedDate, "d MMMM yyyy", { locale: ar })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`book-datepicker-trigger ${error ? "book-datepicker-error" : ""} ${value ? "" : "book-datepicker-placeholder"}`}
        >
          <CalendarDays className="book-datepicker-icon" />
          <span>{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="book-datepicker-nav">
          <select
            value={viewMonth.getMonth()}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="book-datepicker-select"
          >
            {ARABIC_MONTHS.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={viewMonth.getFullYear()}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="book-datepicker-select"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <Calendar
          dir="rtl"
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={viewMonth}
          onMonthChange={setViewMonth}
          fromDate={minDate}
          toDate={maxDate}
          classNames={{
            nav_button_previous: "absolute right-1",
            nav_button_next: "absolute left-1",
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
