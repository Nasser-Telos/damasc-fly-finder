import { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { Flight } from "@/types/flight";

interface PriceCalendarProps {
  flights: Flight[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDay: number | null;
  onDaySelect: (day: number | null) => void;
  selectedDestination: string | null;
}

const DAY_NAMES = ["سبت", "أحد", "إثن", "ثلا", "أرب", "خمي", "جمع"];

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ISO day: 1=Mon..7=Sun → our grid: 0=Sat..6=Fri
function isoToGridCol(isoDay: number): number {
  // isoDay: 1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat,7=Sun
  // grid:   0=Sat,1=Sun,2=Mon,3=Tue,4=Wed,5=Thu,6=Fri
  if (isoDay === 6) return 0; // Sat
  if (isoDay === 7) return 1; // Sun
  return isoDay + 1; // Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
}

function getIsoDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month, day);
  const jsDay = d.getDay(); // 0=Sun..6=Sat
  if (jsDay === 0) return 7; // Sun
  return jsDay; // Mon=1..Sat=6
}

export function PriceCalendar({
  flights,
  currentMonth,
  onMonthChange,
  selectedDay,
  onDaySelect,
  selectedDestination,
}: PriceCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Calculate cheapest price per day
  const dayPrices = useMemo(() => {
    const prices: Record<number, number> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const isoDay = getIsoDayOfWeek(year, month, day);

      // Filter flights operating on this day of week
      let dayFlights = flights.filter(
        (f) => f.days_of_week && f.days_of_week.includes(isoDay)
      );

      // Filter by destination if selected
      if (selectedDestination) {
        dayFlights = dayFlights.filter(
          (f) =>
            f.origin?.airport_code === selectedDestination ||
            f.destination?.airport_code === selectedDestination
        );
      }

      // Get cheapest price
      const withPrice = dayFlights.filter((f) => f.price_usd != null);
      if (withPrice.length > 0) {
        prices[day] = Math.min(...withPrice.map((f) => f.price_usd!));
      }
    }

    return prices;
  }, [flights, year, month, daysInMonth, selectedDestination]);

  // Calculate price tiers for coloring
  const { minPrice, maxPrice } = useMemo(() => {
    const allPrices = Object.values(dayPrices);
    if (allPrices.length === 0) return { minPrice: 0, maxPrice: 0 };
    return {
      minPrice: Math.min(...allPrices),
      maxPrice: Math.max(...allPrices),
    };
  }, [dayPrices]);

  function getPriceTier(price: number): "cheap" | "mid" | "expensive" {
    if (maxPrice === minPrice) return "cheap";
    const range = maxPrice - minPrice;
    const third = range / 3;
    if (price <= minPrice + third) return "cheap";
    if (price <= minPrice + third * 2) return "mid";
    return "expensive";
  }

  // Build calendar grid
  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number; gridCol: number } | null> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const isoDay = getIsoDayOfWeek(year, month, day);
      const gridCol = isoToGridCol(isoDay);
      cells.push({ day, gridCol });
    }

    return cells;
  }, [year, month, daysInMonth]);

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    onMonthChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    onMonthChange(next);
  };

  return (
    <div className="explore-calendar">
      {/* Month navigation */}
      <div className="explore-cal-nav">
        <button className="explore-cal-arrow" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="explore-cal-month">
          {MONTH_NAMES_AR[month]} {year}
        </span>
        <button className="explore-cal-arrow" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="explore-cal-grid explore-cal-header">
        {DAY_NAMES.map((name) => (
          <div key={name} className="explore-cal-dayname">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="explore-cal-grid">
        {calendarCells.map((cell) => {
          if (!cell) return null;
          const { day, gridCol } = cell;
          const price = dayPrices[day];
          const tier = price != null ? getPriceTier(price) : null;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              className={`explore-cal-cell ${tier ? `explore-cal-${tier}` : "explore-cal-empty"} ${isSelected ? "explore-cal-selected" : ""}`}
              style={day === 1 ? { gridColumn: gridCol + 1 } : undefined}
              onClick={() => onDaySelect(isSelected ? null : day)}
            >
              <span className="explore-cal-daynum">{day}</span>
              {price != null && (
                <span className="explore-cal-price">${price}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="explore-cal-legend">
        <div className="explore-legend-item">
          <span className="explore-legend-dot explore-legend-cheap" />
          <span>أرخص</span>
        </div>
        <div className="explore-legend-item">
          <span className="explore-legend-dot explore-legend-mid" />
          <span>متوسط</span>
        </div>
        <div className="explore-legend-item">
          <span className="explore-legend-dot explore-legend-expensive" />
          <span>أغلى</span>
        </div>
      </div>
    </div>
  );
}
