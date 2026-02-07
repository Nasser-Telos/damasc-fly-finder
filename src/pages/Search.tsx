import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { ArrowRight, Loader2, Plane, Clock, ExternalLink } from "lucide-react";
import { useDamascusFlights, useAleppoFlights } from "@/hooks/useFlights";
import type { Flight } from "@/types/flight";
import "./Search.css";

type SortBy = "price" | "duration" | "departure";

const AIRPORT_LABELS: Record<string, string> = {
  DAM: "دمشق",
  ALP: "حلب",
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}س ${m}د`;
}

function formatPrice(price: number | null) {
  if (!price) return "اتصل للسعر";
  return `$${price.toLocaleString()}`;
}

function SearchFlightCard({ flight }: { flight: Flight }) {
  return (
    <div className="search-flight-card">
      {/* Airline */}
      <div className="search-fc-top">
        <div className="search-fc-logo">
          {flight.airline?.code}
        </div>
        <div className="search-fc-airline-info">
          <span className="search-fc-airline-name">{flight.airline?.name_ar}</span>
          <span className="search-fc-flight-num">{flight.flight_number}</span>
        </div>
      </div>

      {/* Route */}
      <div className="search-fc-route">
        <div className="search-fc-point">
          <span className="search-fc-time">{formatTime(flight.departure_time)}</span>
          <span className="search-fc-city">{flight.origin?.city_ar}</span>
          <span className="search-fc-code">{flight.origin?.airport_code}</span>
        </div>

        <div className="search-fc-middle">
          <span className="search-fc-duration">
            <Clock className="h-3 w-3" />
            {formatDuration(flight.duration_minutes)}
          </span>
          <div className="search-fc-line">
            <div className="search-fc-line-bar" />
            <Plane className="h-3.5 w-3.5 -rotate-90" style={{ color: "hsl(217 91% 60%)", margin: "0 4px" }} />
            <div className="search-fc-line-bar" />
          </div>
          <span className="search-fc-stops">
            {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
          </span>
        </div>

        <div className="search-fc-point">
          <span className="search-fc-time">{formatTime(flight.arrival_time)}</span>
          <span className="search-fc-city">{flight.destination?.city_ar}</span>
          <span className="search-fc-code">{flight.destination?.airport_code}</span>
        </div>
      </div>

      {/* Price & Book */}
      <div className="search-fc-bottom">
        <div>
          <span className="search-fc-price">{formatPrice(flight.price_usd)}</span>
          <span className="search-fc-price-label">للشخص</span>
        </div>
        {flight.airline?.website_url && (
          <a
            href={flight.airline.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="search-fc-book"
          >
            احجز
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  const tripType = searchParams.get("type") || "to_damascus";
  const airportParam = searchParams.get("airport") || "DAM";
  const destinationCode = searchParams.get("destination") || undefined;
  const airport = airportParam.toUpperCase();

  const isAleppo = airport === "ALP";
  const isDamascus = !isAleppo;

  // Determine direction
  const isFromLocal = tripType.startsWith("from_");
  const type: "from" | "to" = isFromLocal ? "from" : "to";
  const destFilter = destinationCode === "all" ? undefined : destinationCode;

  // Use the correct hook based on airport
  const damascusResult = useDamascusFlights(type, destFilter);
  const aleppoResult = useAleppoFlights(type, destFilter);

  const { data: flights, isLoading } = isAleppo ? aleppoResult : damascusResult;

  const [sortBy, setSortBy] = useState<SortBy>("price");
  const [directOnly, setDirectOnly] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Build route label
  const localCity = AIRPORT_LABELS[airport] || "دمشق";
  const destCity = useMemo(() => {
    if (!flights || flights.length === 0) return "";
    if (isFromLocal) {
      const dest = flights[0]?.destination?.city_ar;
      return dest || "";
    }
    const origin = flights[0]?.origin?.city_ar;
    return origin || "";
  }, [flights, isFromLocal]);

  // Filter and sort
  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    let result = [...flights];

    if (directOnly) {
      result = result.filter((f) => f.stops === 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.price_usd || 9999) - (b.price_usd || 9999);
        case "duration":
          return a.duration_minutes - b.duration_minutes;
        case "departure":
          return a.departure_time.localeCompare(b.departure_time);
        default:
          return 0;
      }
    });

    return result;
  }, [flights, sortBy, directOnly]);

  const routeLabel = isFromLocal
    ? `${localCity} ← ${destCity || "جميع الوجهات"}`
    : `${destCity || "جميع الوجهات"} ← ${localCity}`;

  return (
    <div dir="rtl" className={`search-root ${ready ? "search-on" : ""}`}>
      {/* Header */}
      <header className="search-header">
        <button className="search-back" onClick={() => navigate(-1)}>
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="search-route-info">
          <span className="search-route-text">
            {routeLabel}
          </span>
          <span className="search-count">
            {isLoading ? "جاري البحث..." : `${filteredFlights.length} رحلة متاحة`}
          </span>
        </div>
      </header>

      {/* Filter Pills */}
      <div className="search-filters">
        <div className="search-filters-inner">
          <button
            className={`search-filter-pill ${sortBy === "price" && !directOnly ? "search-filter-pill-on" : ""}`}
            onClick={() => { setSortBy("price"); setDirectOnly(false); }}
          >
            الأرخص
          </button>
          <button
            className={`search-filter-pill ${sortBy === "duration" ? "search-filter-pill-on" : ""}`}
            onClick={() => setSortBy("duration")}
          >
            الأقصر
          </button>
          <button
            className={`search-filter-pill ${sortBy === "departure" ? "search-filter-pill-on" : ""}`}
            onClick={() => setSortBy("departure")}
          >
            وقت المغادرة
          </button>
          <button
            className={`search-filter-pill ${directOnly ? "search-filter-pill-on" : ""}`}
            onClick={() => setDirectOnly(!directOnly)}
          >
            مباشرة فقط
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="search-loading">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(217 91% 60%)" }} />
          <span>جاري البحث عن الرحلات...</span>
        </div>
      ) : filteredFlights.length === 0 ? (
        <div className="search-no-flights">
          <div className="search-no-flights-icon">✈️</div>
          <div className="search-no-flights-title">لا توجد رحلات</div>
          <p>جرب تغيير الفلتر أو العودة واختيار وجهة مختلفة</p>
        </div>
      ) : (
        <div className="search-results">
          {filteredFlights.map((flight) => (
            <SearchFlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
