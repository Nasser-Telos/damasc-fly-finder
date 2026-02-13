import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { ArrowRight, ArrowLeft, Plane, Clock, ExternalLink, ChevronUp } from "lucide-react";
import { useDamascusFlights, useAleppoFlights } from "@/hooks/useFlights";
import type { Flight } from "@/types/flight";
import { formatTime, formatDuration, formatPrice } from "@/lib/formatters";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import "./Search.css";

type SortBy = "price" | "duration" | "departure";

const AIRPORT_LABELS: Record<string, string> = {
  DAM: "دمشق",
  ALP: "حلب",
};

function SearchFlightCard({ flight, isCheapest, index = 0 }: { flight: Flight; isCheapest?: boolean; index?: number }) {
  return (
    <div
      className={`search-flight-card search-flight-fadein${isCheapest ? " search-flight-card-best" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Cheapest Badge */}
      {isCheapest && (
        <div className="search-fc-badge">
          <span>★</span>
          أرخص سعر
        </div>
      )}

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
            <span className="search-fc-dot" />
            <div className="search-fc-line-bar" />
            <Plane className="h-3.5 w-3.5 -rotate-90" style={{ color: "hsl(217 91% 60%)", margin: "0 4px" }} />
            <div className="search-fc-line-bar" />
            <span className="search-fc-dot" />
          </div>
          <span className={`search-fc-stops${flight.stops > 0 ? " search-fc-stops-transfer" : ""}`}>
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
            {flight.price_usd ? "احجز" : "استعلم عن السعر"}
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

  return (
    <>
    <div dir="rtl" className={`search-root ${ready ? "search-on" : ""}`}>
      {/* Header */}
      <header className="search-header">
        <button className="search-back" onClick={() => navigate(-1)}>
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="search-route-info">
          <span className="search-route-text">
            {isFromLocal ? (
              <>
                {localCity}
                <ArrowLeft className="h-4 w-4 search-route-arrow-icon" />
                {destCity || "جميع الوجهات"}
              </>
            ) : (
              <>
                {destCity || "جميع الوجهات"}
                <ArrowLeft className="h-4 w-4 search-route-arrow-icon" />
                {localCity}
              </>
            )}
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
            className={`search-filter-pill ${sortBy === "price" ? "search-filter-pill-on" : ""}`}
            onClick={() => setSortBy("price")}
          >
            الأرخص
            {sortBy === "price" && <ChevronUp className="h-3 w-3" />}
          </button>
          <button
            className={`search-filter-pill ${sortBy === "duration" ? "search-filter-pill-on" : ""}`}
            onClick={() => setSortBy("duration")}
          >
            الأقصر
            {sortBy === "duration" && <ChevronUp className="h-3 w-3" />}
          </button>
          <button
            className={`search-filter-pill ${sortBy === "departure" ? "search-filter-pill-on" : ""}`}
            onClick={() => setSortBy("departure")}
          >
            وقت المغادرة
            {sortBy === "departure" && <ChevronUp className="h-3 w-3" />}
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
          <LoadingSpinner text="جاري البحث عن الرحلات..." size="lg" />
        </div>
      ) : filteredFlights.length === 0 ? (
        <div className="search-no-flights">
          <div className="search-no-flights-icon">✈️</div>
          <div className="search-no-flights-title">لا توجد رحلات</div>
          <p>جرب تغيير الفلتر أو العودة واختيار وجهة مختلفة</p>
        </div>
      ) : (
        <div className="search-results">
          {filteredFlights.map((flight, index) => (
            <SearchFlightCard
              key={flight.id}
              flight={flight}
              isCheapest={sortBy === "price" && index === 0}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
