import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAllFlightsForAirport } from "@/hooks/useFlights";
import { PriceCalendar } from "@/components/flight/PriceCalendar";
import { ExploreFlightCard } from "@/components/flight/ExploreFlightCard";
import type { Flight } from "@/types/flight";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { normalizeArabic } from "@/lib/destinationFilter";
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = (airportCode || "DAM").toUpperCase();
  const airport = AIRPORT_LABELS[code] || AIRPORT_LABELS["DAM"];

  const handleAirportSwitch = (newCode: string) => {
    if (newCode !== code) {
      navigate(`/explore/${newCode}`, { replace: true });
    }
  };

  const [ready, setReady] = useState(false);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    () => searchParams.get("dest") || null
  );
  const [pillQuery, setPillQuery] = useState('');

  const { data: flights, isLoading } = useAllFlightsForAirport(code);

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Reset selected day when destination changes
  useEffect(() => {
    setSelectedDay(null);
  }, [selectedDestination]);

  // Reset selections when airport changes
  useEffect(() => {
    setSelectedDay(null);
    setSelectedDestination(null);
    setPillQuery('');
  }, [code]);

  // Get unique destinations for pills
  const destinations = useMemo(() => {
    if (!flights) return [];
    const destMap = new Map<string, { code: string; name: string; country_ar: string }>();

    flights.forEach((f) => {
      const other =
        f.origin?.airport_code === code ? f.destination : f.origin;
      if (other && !destMap.has(other.airport_code)) {
        destMap.set(other.airport_code, {
          code: other.airport_code,
          name: other.city_ar,
          country_ar: other.country_ar,
        });
      }
    });

    return Array.from(destMap.values());
  }, [flights, code]);

  // Filter destination pills by search query
  const filteredPills = useMemo(() => {
    if (!pillQuery) return { pills: destinations, matchedCountry: null as string | null };
    const q = pillQuery.toLowerCase();
    const nq = normalizeArabic(pillQuery);

    // Check for country match
    const countryMatches = new Set<string>();
    for (const d of destinations) {
      if (normalizeArabic(d.country_ar).includes(nq)) {
        countryMatches.add(d.country_ar);
      }
    }
    const matchedCountry = countryMatches.size === 1 ? Array.from(countryMatches)[0] : null;

    const pills = destinations.filter(d =>
      normalizeArabic(d.name).includes(nq) ||
      normalizeArabic(d.country_ar).includes(nq) ||
      d.code.toLowerCase().includes(q)
    );

    return { pills, matchedCountry };
  }, [destinations, pillQuery]);

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
    <>
    <div dir="rtl" className={`explore-root ${ready ? "explore-on" : ""}`}>
      {/* Header */}
      <header className="explore-header">
        <button className="explore-back" onClick={() => navigate("/")}>
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="explore-title">رحلات من وإلى {airport.name}</h1>
      </header>

      {/* Airport Selector */}
      <div className="explore-airport-wrap">
        <div className="explore-airport-seg">
          {Object.entries(AIRPORT_LABELS).map(([key, val]) => (
            <button
              key={key}
              className={`explore-airport-btn ${code === key ? "explore-airport-on" : ""}`}
              onClick={() => handleAirportSwitch(key)}
            >
              إلى {val.name}
              <span className="explore-airport-code">{key}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="explore-loading">
          <LoadingSpinner text="جاري تحميل الرحلات..." />
        </div>
      ) : (
        <>
          {/* Destination search */}
          <div className="explore-dest-search-wrap">
            <input
              value={pillQuery}
              onChange={e => setPillQuery(e.target.value)}
              placeholder="البحث عن وجهة أو دولة..."
              className="explore-dest-search"
            />
            {pillQuery && (
              <button className="explore-dest-search-clear" onClick={() => setPillQuery('')}>✕</button>
            )}
          </div>

          {/* Country badge */}
          {filteredPills.matchedCountry && (
            <div className="explore-pills-country-badge">
              {filteredPills.matchedCountry}
              <span className="explore-pills-country-count">
                — {filteredPills.pills.length} {filteredPills.pills.length > 2 ? 'مدن' : filteredPills.pills.length === 2 ? 'وجهتان' : 'وجهة'}
              </span>
            </div>
          )}

          {/* Destination pills */}
          <div className="explore-pills-wrap">
            <div className="explore-pills">
              {!pillQuery && (
                <button
                  className={`explore-pill ${selectedDestination === null ? "explore-pill-on" : ""}`}
                  onClick={() => setSelectedDestination(null)}
                >
                  جميع الوجهات
                </button>
              )}
              {filteredPills.pills.map((d) => (
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
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            selectedDestination={selectedDestination}
          />

          {/* Flights list - only when a day is selected */}
          {selectedDay !== null && (
            <div className="explore-flights-section explore-flights-fadein">
              <h2 className="explore-flights-title">{flightsTitle}</h2>

              {sortedFlights.length === 0 ? (
                <div className="explore-no-flights">
                  لا توجد رحلات متاحة في هذا اليوم
                </div>
              ) : (
                sortedFlights.map((flight) => (
                  <ExploreFlightCard key={flight.id} flight={flight} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
};

export default Explore;
