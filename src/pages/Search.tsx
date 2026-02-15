import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Plane, Clock, ExternalLink, ChevronUp, RefreshCw } from "lucide-react";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import type { LiveFlight, FlightSearchRequest } from "@/types/flight";
import { formatDuration, formatPrice } from "@/lib/formatters";
import { getAirlineArabicName } from "@/lib/airlineLookup";
import { buildGoogleFlightsUrl } from "@/lib/flightMapper";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import "./Search.css";

type SortBy = "price" | "duration" | "departure";

const AIRPORT_LABELS: Record<string, string> = {
  DAM: "دمشق",
  ALP: "حلب",
};

const STATUS_MESSAGES = [
  { delay: 0, text: "جاري البحث في Google Flights..." },
  { delay: 5000, text: "جاري مقارنة الأسعار..." },
  { delay: 15000, text: "جاري تحليل أفضل العروض..." },
  { delay: 30000, text: "يتم الآن جلب النتائج..." },
];

function SearchFlightCard({ flight, isCheapest, index = 0 }: { flight: LiveFlight; isCheapest?: boolean; index?: number }) {
  const arabicName = getAirlineArabicName(flight.airlineCode);
  const departureId = flight.departureAirport.id;
  const arrivalId = flight.arrivalAirport.id;

  const layoverText = useMemo(() => {
    if (!flight.layovers || flight.layovers.length === 0) return null;
    return flight.layovers
      .map(l => `${Math.floor(l.duration / 60)}س ${l.duration % 60}د في ${l.name}`)
      .join(' · ');
  }, [flight.layovers]);

  return (
    <div
      className={`search-flight-card search-flight-fadein${isCheapest ? " search-flight-card-best" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {isCheapest && (
        <div className="search-fc-badge">
          <span>★</span>
          أرخص سعر
        </div>
      )}

      {flight.isBest && !isCheapest && (
        <div className="search-fc-badge" style={{ background: 'hsl(142 71% 45%)' }}>
          <span>✓</span>
          أفضل رحلة
        </div>
      )}

      {/* Airline */}
      <div className="search-fc-top">
        <div className="search-fc-logo">
          {flight.airlineLogo ? (
            <img
              src={flight.airlineLogo}
              alt={flight.airlineName}
              style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).parentElement!.textContent = flight.airlineCode); }}
            />
          ) : (
            flight.airlineCode
          )}
        </div>
        <div className="search-fc-airline-info">
          <span className="search-fc-airline-name">{arabicName || flight.airlineName}</span>
          <span className="search-fc-flight-num">{flight.flightNumber}</span>
        </div>
      </div>

      {/* Route */}
      <div className="search-fc-route">
        <div className="search-fc-point">
          <span className="search-fc-time">{flight.departureTime}</span>
          <span className="search-fc-city">{flight.originDestination?.city_ar || flight.departureAirport.name}</span>
          <span className="search-fc-code">{departureId}</span>
        </div>

        <div className="search-fc-middle">
          <span className="search-fc-duration">
            <Clock className="h-3 w-3" />
            {formatDuration(flight.totalDuration)}
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
          {layoverText && (
            <span className="search-fc-layover-detail" style={{ fontSize: '0.65rem', color: 'hsl(215 16% 55%)', marginTop: 2 }}>
              {layoverText}
            </span>
          )}
        </div>

        <div className="search-fc-point">
          <span className="search-fc-time">{flight.arrivalTime}</span>
          <span className="search-fc-city">{flight.arrivalDestination?.city_ar || flight.arrivalAirport.name}</span>
          <span className="search-fc-code">{arrivalId}</span>
        </div>
      </div>

      {/* Price & Book */}
      <div className="search-fc-bottom">
        <div>
          <span className="search-fc-price">{formatPrice(flight.price)}</span>
          <span className="search-fc-price-label">للشخص</span>
        </div>
        <a
          href={buildGoogleFlightsUrl(departureId, arrivalId, "")}
          target="_blank"
          rel="noopener noreferrer"
          className="search-fc-book"
        >
          احجز
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const searchTriggered = useRef(false);

  const tripType = searchParams.get("type") || "to_damascus";
  const airportParam = searchParams.get("airport") || "DAM";
  const destinationCode = searchParams.get("destination") || undefined;
  const dateParam = searchParams.get("date") || undefined;
  const airport = airportParam.toUpperCase();

  const isFromLocal = tripType.startsWith("from_");

  // Build API request params
  const apiParams = useMemo((): FlightSearchRequest | null => {
    if (!destinationCode || !dateParam) return null;

    // Extract YYYY-MM-DD from date param (could be ISO string or already formatted)
    const outbound_date = dateParam.includes('T') ? dateParam.split('T')[0] : dateParam;

    let departure_id: string;
    let arrival_id: string;

    if (isFromLocal) {
      departure_id = airport;
      arrival_id = destinationCode;
    } else {
      departure_id = destinationCode;
      arrival_id = airport;
    }

    return { departure_id, arrival_id, outbound_date };
  }, [airport, destinationCode, dateParam, isFromLocal]);

  const { flights, isSearching, error, search, totalFound } = useFlightSearch(apiParams);

  // Auto-trigger search on mount
  useEffect(() => {
    if (apiParams && !searchTriggered.current) {
      searchTriggered.current = true;
      search();
    }
  }, [apiParams, search]);

  // Progressive status messages
  const [statusIndex, setStatusIndex] = useState(0);
  const statusTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isSearching) {
      setStatusIndex(0);
      statusTimers.current.forEach(clearTimeout);
      statusTimers.current = [];

      STATUS_MESSAGES.forEach((msg, i) => {
        if (i > 0) {
          const timer = setTimeout(() => setStatusIndex(i), msg.delay);
          statusTimers.current.push(timer);
        }
      });
    } else {
      statusTimers.current.forEach(clearTimeout);
      statusTimers.current = [];
    }
    return () => {
      statusTimers.current.forEach(clearTimeout);
    };
  }, [isSearching]);

  const [sortBy, setSortBy] = useState<SortBy>("price");
  const [directOnly, setDirectOnly] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  const localCity = AIRPORT_LABELS[airport] || "دمشق";

  // Derive destination city from first flight result or code
  const destCity = useMemo(() => {
    if (flights.length === 0) return "";
    if (isFromLocal) {
      return flights[0]?.arrivalDestination?.city_ar || flights[0]?.arrivalAirport.name || "";
    }
    return flights[0]?.originDestination?.city_ar || flights[0]?.departureAirport.name || "";
  }, [flights, isFromLocal]);

  // Filter and sort
  const filteredFlights = useMemo(() => {
    let result = [...flights];

    if (directOnly) {
      result = result.filter((f) => f.stops === 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "duration":
          return a.totalDuration - b.totalDuration;
        case "departure":
          return a.departureTime.localeCompare(b.departureTime);
        default:
          return 0;
      }
    });

    return result;
  }, [flights, sortBy, directOnly]);

  // No params = show error
  if (!apiParams) {
    return (
      <div dir="rtl" className={`search-root ${ready ? "search-on" : ""}`}>
        <header className="search-header">
          <button className="search-back" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="search-route-info">
            <span className="search-route-text">البحث عن رحلات</span>
          </div>
        </header>
        <div className="search-no-flights">
          <div className="search-no-flights-icon">✈️</div>
          <div className="search-no-flights-title">معلومات البحث ناقصة</div>
          <p>يرجى اختيار الوجهة والتاريخ من الصفحة الرئيسية</p>
          <button
            className="search-fc-book"
            style={{ marginTop: 16 }}
            onClick={() => navigate("/")}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

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
                {destCity || destinationCode || "جميع الوجهات"}
              </>
            ) : (
              <>
                {destCity || destinationCode || "جميع الوجهات"}
                <ArrowLeft className="h-4 w-4 search-route-arrow-icon" />
                {localCity}
              </>
            )}
          </span>
          <span className="search-count">
            {isSearching
              ? STATUS_MESSAGES[statusIndex].text
              : `${filteredFlights.length} رحلة متاحة${totalFound > 0 ? ` (من ${totalFound})` : ""}`}
          </span>
        </div>
      </header>

      {/* Filter Pills */}
      {!isSearching && flights.length > 0 && (
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
      )}

      {/* Results */}
      {isSearching ? (
        <div className="search-loading">
          <LoadingSpinner text={STATUS_MESSAGES[statusIndex].text} size="lg" />
        </div>
      ) : error ? (
        <div className="search-no-flights">
          <div className="search-no-flights-icon">⚠️</div>
          <div className="search-no-flights-title">حدث خطأ أثناء البحث</div>
          <p>{error.message}</p>
          <button
            className="search-fc-book"
            style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => { searchTriggered.current = false; search(); }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            إعادة المحاولة
          </button>
        </div>
      ) : filteredFlights.length === 0 ? (
        <div className="search-no-flights">
          <div className="search-no-flights-icon">✈️</div>
          <div className="search-no-flights-title">لا توجد رحلات</div>
          <p>لم يتم العثور على رحلات لهذا المسار في التاريخ المحدد</p>
          <button
            className="search-fc-book"
            style={{ marginTop: 16 }}
            onClick={() => navigate(-1)}
          >
            تغيير البحث
          </button>
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
