import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ArrowRight, ArrowLeft, Plane, Clock, ExternalLink, ChevronUp, RefreshCw } from "lucide-react";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { LiveFlight, FlightSearchRequest } from "@/types/flight";
import type { CurrencyCode } from "@/lib/currency";
import { formatDuration, formatPrice } from "@/lib/formatters";
import { getAirlineArabicName } from "@/lib/airlineLookup";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { destinations } from "@/data/destinations";
import "./Search.css";

type SortBy = "price" | "duration" | "departure";

const airportLookup = new Map(destinations.map(d => [d.airport_code, d]));

const STATUS_MESSAGES = [
  { delay: 0, text: "جاري البحث عن رحلات..." },
];

function SearchFlightCard({ flight, isCheapest, index = 0, onBookClick, currency }: { flight: LiveFlight; isCheapest?: boolean; index?: number; onBookClick: (flight: LiveFlight) => void; currency?: CurrencyCode }) {
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
          <span className="search-fc-price">{formatPrice(flight.price, currency)}</span>
          <span className="search-fc-price-label">للشخص</span>
        </div>
        <button
          className="search-fc-book"
          onClick={() => onBookClick(flight)}
        >
          احجز
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [ready, setReady] = useState(false);
  const searchTriggered = useRef(false);

  const tripType = searchParams.get("type") || "to_damascus";
  const airportParam = searchParams.get("airport") || "DAM";
  const destinationCode = searchParams.get("destination") || undefined;
  const dateParam = searchParams.get("date") || undefined;
  const airport = airportParam.toUpperCase();

  const isFromLocal = tripType.startsWith("from_");

  const outboundDate = useMemo(() => {
    if (!dateParam) return "";
    return dateParam.includes('T') ? dateParam.split('T')[0] : dateParam;
  }, [dateParam]);

  // Build API request params
  const apiParams = useMemo((): FlightSearchRequest | null => {
    if (!destinationCode || !dateParam) return null;

    let departure_id: string;
    let arrival_id: string;

    if (isFromLocal) {
      departure_id = airport;
      arrival_id = destinationCode;
    } else {
      departure_id = destinationCode;
      arrival_id = airport;
    }

    return { departure_id, arrival_id, outbound_date: outboundDate, currency };
  }, [airport, destinationCode, dateParam, isFromLocal, outboundDate, currency]);

  const { flights, isSearching, error, search, totalFound } = useFlightSearch(apiParams);

  const handleBookClick = useCallback((flight: LiveFlight) => {
    navigate(`/book/${flight.offerId}`, { state: { flight } });
  }, [navigate]);

  // Auto-trigger search on mount
  useEffect(() => {
    if (apiParams && !searchTriggered.current) {
      searchTriggered.current = true;
      search();
    }
  }, [apiParams, search]);

  // Re-trigger search when currency changes (if results already loaded)
  const prevCurrency = useRef(currency);
  useEffect(() => {
    if (prevCurrency.current !== currency && searchTriggered.current && apiParams) {
      prevCurrency.current = currency;
      search();
    }
  }, [currency, apiParams, search]);

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

  const localDest = airportLookup.get(airport);
  const localCity = localDest?.airport_name_ar || localDest?.city_ar || airport;

  // Derive destination city from first flight result or destinations data
  const destCity = useMemo(() => {
    if (flights.length > 0) {
      if (isFromLocal) {
        return flights[0]?.arrivalDestination?.airport_name_ar || flights[0]?.arrivalDestination?.city_ar || flights[0]?.arrivalAirport.name || "";
      }
      return flights[0]?.originDestination?.airport_name_ar || flights[0]?.originDestination?.city_ar || flights[0]?.departureAirport.name || "";
    }
    // Fallback to destinations data
    if (destinationCode) {
      const dest = airportLookup.get(destinationCode);
      if (dest) return dest.airport_name_ar || dest.city_ar;
    }
    return "";
  }, [flights, isFromLocal, destinationCode]);

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
              onBookClick={handleBookClick}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>

    </>
  );
}
