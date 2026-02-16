import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Plane } from "lucide-react";
import { useDestinations } from "@/hooks/useFlights";
import { useFlightCalendar } from "@/hooks/useFlightCalendar";
import { normalizeArabic } from "@/lib/destinationFilter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import "./Explore.css";

const AIRPORT_LABELS: Record<string, { name: string; label: string }> = {
  DAM: { name: "دمشق", label: "مطار دمشق الدولي" },
  ALP: { name: "حلب", label: "مطار حلب الدولي" },
};

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
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    () => searchParams.get("dest") || null
  );
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [destQuery, setDestQuery] = useState("");

  const { data: allDestinations } = useDestinations();

  // Non-Syrian destinations from static data
  const destinations = useMemo(() => {
    if (!allDestinations) return [];
    return allDestinations
      .filter((d) => d.airport_code !== "DAM" && d.airport_code !== "ALP")
      .map((d) => ({
        code: d.airport_code,
        name: d.city_ar,
        airport_name_ar: d.airport_name_ar || d.city_ar,
        country_ar: d.country_ar,
      }));
  }, [allDestinations]);

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Reset selections when airport changes
  useEffect(() => {
    setSelectedDestination(null);
  }, [code]);

  // Get selected destination label
  const selectedDestLabel = useMemo(() => {
    if (!selectedDestination) return null;
    return destinations.find((d) => d.code === selectedDestination) || null;
  }, [selectedDestination, destinations]);

  // Filter destinations in picker
  const filteredDestinations = useMemo(() => {
    if (!destQuery) return destinations;
    const nq = normalizeArabic(destQuery);
    const q = destQuery.toLowerCase();
    return destinations.filter(
      (d) =>
        normalizeArabic(d.name).includes(nq) ||
        normalizeArabic(d.airport_name_ar).includes(nq) ||
        normalizeArabic(d.country_ar).includes(nq) ||
        d.code.toLowerCase().includes(q)
    );
  }, [destinations, destQuery]);

  // Group filtered destinations by country for picker
  const groupedDestinations = useMemo(() => {
    const groups: Record<string, typeof destinations> = {};
    for (const d of filteredDestinations) {
      if (!groups[d.country_ar]) groups[d.country_ar] = [];
      groups[d.country_ar].push(d);
    }
    return groups;
  }, [filteredDestinations]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Quick destination pills (top 8)
  const quickPills = useMemo(() => destinations.slice(0, 8), [destinations]);

  // Calendar price params — fetch when destination is selected
  const calendarParams = useMemo(() => {
    if (!selectedDestination) return null;
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const outbound_date_start = `${year}-${pad(month + 1)}-01`;
    const outbound_date_end = `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`;
    return {
      departure_id: selectedDestination,
      arrival_id: code,
      outbound_date_start,
      outbound_date_end,
    };
  }, [selectedDestination, code, calMonth]);

  const { calendarMap, isLoading: calendarLoading, cheapestDate } =
    useFlightCalendar(calendarParams);

  // Price tier thresholds (percentile-based)
  const { p33, p66 } = useMemo(() => {
    const prices = [...calendarMap.values()]
      .map((e) => e.price)
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b);
    if (prices.length === 0) return { p33: 0, p66: 0 };
    return {
      p33: prices[Math.floor(prices.length * 0.33)],
      p66: prices[Math.floor(prices.length * 0.66)],
    };
  }, [calendarMap]);

  const getPriceTier = (price: number) => {
    if (price <= p33) return "cheap";
    if (price <= p66) return "mid";
    return "expensive";
  };

  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = (first.getDay() + 1) % 7;
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
  }, [calMonth]);

  const weekDayLabels = ["سب", "أح", "اث", "ثل", "أر", "خم", "جم"];

  const handleDateClick = (day: number) => {
    if (!selectedDestination) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${calMonth.getFullYear()}-${pad(calMonth.getMonth() + 1)}-${pad(day)}`;
    const entry = calendarMap.get(dateStr);
    if (!entry?.price) return;
    const searchType = `from_${code === "ALP" ? "aleppo" : "damascus"}`;
    navigate(
      `/search?type=${searchType}&airport=${code}&destination=${selectedDestination}&date=${dateStr}`
    );
  };

  const handleSelectDestination = (destCode: string) => {
    setSelectedDestination(destCode);
    setShowDestPicker(false);
    setDestQuery("");
  };

  // Lock body scroll when picker is open
  useEffect(() => {
    document.body.style.overflow = showDestPicker ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDestPicker]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDestPicker) {
        setShowDestPicker(false);
        setDestQuery("");
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showDestPicker]);

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

        {/* Destination Route Field */}
        <div className="explore-route-wrap">
          <button
            className="explore-route-field"
            onClick={() => setShowDestPicker(true)}
          >
            <svg
              className="explore-route-icon"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <div className="explore-route-text">
              <span className="explore-route-label">من</span>
              <span
                className="explore-route-value"
                data-has-dest={selectedDestLabel ? "" : undefined}
              >
                {selectedDestLabel
                  ? `${selectedDestLabel.airport_name_ar} (${selectedDestLabel.code})`
                  : "اختر مطار المغادرة"}
              </span>
            </div>
            <svg
              className="explore-route-chevron"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Quick Destination Pills */}
        <div className="explore-pills-wrap">
          <div className="explore-pills">
            <button
              className={`explore-pill ${selectedDestination === null ? "explore-pill-on" : ""}`}
              onClick={() => setSelectedDestination(null)}
            >
              جميع
            </button>
            {quickPills.map((d) => (
              <button
                key={d.code}
                className={`explore-pill ${selectedDestination === d.code ? "explore-pill-on" : ""}`}
                onClick={() =>
                  setSelectedDestination(
                    selectedDestination === d.code ? null : d.code
                  )
                }
              >
                {d.name}{" "}
                <span className="explore-pill-code">{d.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="explore-calendar">
          {selectedDestination ? (
            <>
              {/* Month Navigation */}
              <div className="explore-cal-nav">
                <button
                  className="explore-cal-arrow"
                  onClick={() =>
                    setCalMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                    )
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <span className="explore-cal-month">
                  {format(calMonth, "MMMM yyyy", { locale: ar })}
                </span>
                <button
                  className="explore-cal-arrow"
                  onClick={() =>
                    setCalMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                    )
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="explore-cal-grid explore-cal-header">
                {weekDayLabels.map((d) => (
                  <span key={d} className="explore-cal-dayname">
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="explore-cal-grid">
                {calDays.map((d, i) => {
                  if (d === null) return <span key={`e${i}`} />;
                  const date = new Date(
                    calMonth.getFullYear(),
                    calMonth.getMonth(),
                    d
                  );
                  const isPast = date.getTime() < today.getTime();
                  const isToday = date.getTime() === today.getTime();
                  const pad = (n: number) => String(n).padStart(2, "0");
                  const dateStr = `${calMonth.getFullYear()}-${pad(calMonth.getMonth() + 1)}-${pad(d)}`;
                  const entry = calendarMap.get(dateStr);
                  const isCheapest = cheapestDate === dateStr;
                  const noFlights = entry?.has_no_flights === true;
                  const hasPrice = entry?.price != null;
                  const tier = hasPrice ? getPriceTier(entry!.price!) : null;

                  const cellClasses = [
                    "explore-cal-cell",
                    isPast && "explore-cal-past",
                    noFlights && !isPast && "explore-cal-no-flights",
                    isCheapest && !isPast && "explore-cal-cheapest",
                    isToday && !isPast && "explore-cal-today",
                    tier && !isPast && `explore-cal-${tier}`,
                    !hasPrice && !isPast && !noFlights && "explore-cal-empty",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={d}
                      className={cellClasses}
                      disabled={isPast || noFlights || !hasPrice}
                      onClick={() => handleDateClick(d)}
                      style={{ animationDelay: `${i * 15}ms` }}
                    >
                      <span
                        className={`explore-cal-daynum${isToday ? " explore-cal-today-num" : ""}`}
                      >
                        {d}
                      </span>
                      {isToday && <span className="explore-cal-today-dot" />}
                      {!isPast &&
                        (calendarLoading ? (
                          <span className="explore-cal-loading">...</span>
                        ) : hasPrice ? (
                          <span className="explore-cal-price">
                            ${entry!.price}
                          </span>
                        ) : null)}
                    </button>
                  );
                })}
              </div>

              {/* Price Legend */}
              {!calendarLoading && calendarMap.size > 0 && (
                <div className="explore-cal-legend">
                  <div className="explore-legend-item">
                    <span className="explore-legend-dot explore-legend-cheap" />
                    رخيص
                  </div>
                  <div className="explore-legend-item">
                    <span className="explore-legend-dot explore-legend-mid" />
                    متوسط
                  </div>
                  <div className="explore-legend-item">
                    <span className="explore-legend-dot explore-legend-expensive" />
                    مرتفع
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="explore-empty">
              <svg
                className="explore-empty-icon"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2.5" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="explore-empty-text">
                اختر وجهة لعرض تقويم الأسعار
              </p>
              <p className="explore-empty-hint">
                اضغط على حقل الوجهة أعلاه أو اختر من القائمة السريعة
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Destination Picker Bottom Sheet */}
      {showDestPicker && (
        <div
          className="syria-ov"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="اختيار الوجهة"
          onClick={() => {
            setShowDestPicker(false);
            setDestQuery("");
          }}
        >
          <div className="syria-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="syria-sh-bar">
              <div className="syria-sh-handle" />
            </div>
            <div className="syria-sh-head">
              <input
                autoFocus
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                placeholder="البحث عن مدينة أو دولة..."
                className="syria-sh-q"
              />
              <button
                className="syria-sh-x"
                onClick={() => {
                  setShowDestPicker(false);
                  setDestQuery("");
                }}
              >
                إلغاء
              </button>
            </div>
            <div className="syria-sh-body">
              {filteredDestinations.length === 0 ? (
                <div className="syria-sh-none">لا توجد نتائج</div>
              ) : (
                Object.entries(groupedDestinations).map(([country, dests]) => (
                  <div key={country}>
                    <div className="explore-picker-country">{country}</div>
                    {dests.map((dest) => (
                      <button
                        key={dest.code}
                        className={`syria-sh-row ${selectedDestination === dest.code ? "syria-sh-act" : ""}`}
                        onClick={() => handleSelectDestination(dest.code)}
                      >
                        <div className="syria-sh-icon">
                          <Plane
                            className="h-5 w-5"
                            style={{ color: "hsl(215 16% 47%)" }}
                          />
                        </div>
                        <div className="syria-sh-col">
                          <span className="syria-sh-n">
                            {dest.airport_name_ar}
                          </span>
                          <span className="syria-sh-c">
                            {dest.name} · {dest.country_ar}
                          </span>
                        </div>
                        <span className="syria-sh-cd">{dest.code}</span>
                        {selectedDestination === dest.code && (
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            stroke="hsl(217 91% 60%)"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Explore;
