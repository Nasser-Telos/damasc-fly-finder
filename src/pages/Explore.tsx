import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAllFlightsForAirport } from "@/hooks/useFlights";
import { PriceCalendar } from "@/components/flight/PriceCalendar";
import { ExploreFlightCard } from "@/components/flight/ExploreFlightCard";
import type { Flight } from "@/types/flight";
import "./Explore.css";

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const AIRPORT_LABELS: Record<string, { name: string; label: string }> = {
  DAM: { name: "دمشق", label: "مطار دمشق الدولي" },
  ALP: { name: "حلب", label: "مطار حلب الدولي" },
};

function getIsoDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month, day);
  const jsDay = d.getDay();
  if (jsDay === 0) return 7;
  return jsDay;
}

const Explore = () => {
  const { airportCode } = useParams<{ airportCode: string }>();
  const navigate = useNavigate();
  const code = (airportCode || "DAM").toUpperCase();
  const airport = AIRPORT_LABELS[code] || AIRPORT_LABELS["DAM"];

  const [ready, setReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const { data: flights, isLoading } = useAllFlightsForAirport(code);

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Reset selected day when month or destination changes
  useEffect(() => {
    setSelectedDay(null);
  }, [currentMonth, selectedDestination]);

  // Get unique destinations for pills
  const destinations = useMemo(() => {
    if (!flights) return [];
    const destMap = new Map<string, { code: string; name: string }>();

    flights.forEach((f) => {
      const other =
        f.origin?.airport_code === code ? f.destination : f.origin;
      if (other && !destMap.has(other.airport_code)) {
        destMap.set(other.airport_code, {
          code: other.airport_code,
          name: other.city_ar,
        });
      }
    });

    return Array.from(destMap.values());
  }, [flights, code]);

  // Filtered flights based on selected destination
  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    let result = flights;

    if (selectedDestination) {
      result = result.filter(
        (f) =>
          f.origin?.airport_code === selectedDestination ||
          f.destination?.airport_code === selectedDestination
      );
    }

    return result;
  }, [flights, selectedDestination]);

  // Flights for selected day
  const dayFlights = useMemo(() => {
    if (!selectedDay) return filteredFlights;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const isoDay = getIsoDayOfWeek(year, month, selectedDay);

    return filteredFlights.filter(
      (f) => f.days_of_week && f.days_of_week.includes(isoDay)
    );
  }, [filteredFlights, selectedDay, currentMonth]);

  // Sort by price
  const sortedFlights = useMemo(() => {
    return [...dayFlights].sort((a, b) => {
      if (a.price_usd == null) return 1;
      if (b.price_usd == null) return -1;
      return a.price_usd - b.price_usd;
    });
  }, [dayFlights]);

  const flightsTitle = selectedDay
    ? `رحلات يوم ${selectedDay} ${MONTH_NAMES_AR[currentMonth.getMonth()]}`
    : "جميع الرحلات المتاحة";

  return (
    <div dir="rtl" className={`explore-root ${ready ? "explore-on" : ""}`}>
      {/* Header */}
      <header className="explore-header">
        <button className="explore-back" onClick={() => navigate("/")}>
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="explore-title">رحلات من وإلى {airport.name}</h1>
      </header>

      {isLoading ? (
        <div className="explore-loading">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(217 91% 60%)" }} />
          <span>جاري تحميل الرحلات...</span>
        </div>
      ) : (
        <>
          {/* Destination pills */}
          <div className="explore-pills-wrap">
            <div className="explore-pills">
              <button
                className={`explore-pill ${selectedDestination === null ? "explore-pill-on" : ""}`}
                onClick={() => setSelectedDestination(null)}
              >
                جميع الوجهات
              </button>
              {destinations.map((d) => (
                <button
                  key={d.code}
                  className={`explore-pill ${selectedDestination === d.code ? "explore-pill-on" : ""}`}
                  onClick={() =>
                    setSelectedDestination(
                      selectedDestination === d.code ? null : d.code
                    )
                  }
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Calendar */}
          <PriceCalendar
            flights={filteredFlights}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            selectedDestination={selectedDestination}
          />

          {/* Flights list */}
          <div className="explore-flights-section">
            <h2 className="explore-flights-title">{flightsTitle}</h2>

            {sortedFlights.length === 0 ? (
              <div className="explore-no-flights">
                لا توجد رحلات متاحة
                {selectedDay ? " في هذا اليوم" : ""}
              </div>
            ) : (
              sortedFlights.map((flight) => (
                <ExploreFlightCard key={flight.id} flight={flight} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Explore;
