import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { useDestinations } from "@/hooks/useFlights";
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
  const [pillQuery, setPillQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());

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
    setPillQuery("");
  }, [code]);

  // Filter destination pills by search query
  const filteredPills = useMemo(() => {
    if (!pillQuery)
      return { pills: destinations, matchedCountry: null as string | null };
    const q = pillQuery.toLowerCase();
    const nq = normalizeArabic(pillQuery);

    const countryMatches = new Set<string>();
    for (const d of destinations) {
      if (normalizeArabic(d.country_ar).includes(nq)) {
        countryMatches.add(d.country_ar);
      }
    }
    const matchedCountry =
      countryMatches.size === 1 ? Array.from(countryMatches)[0] : null;

    const pills = destinations.filter(
      (d) =>
        normalizeArabic(d.name).includes(nq) ||
        normalizeArabic(d.airport_name_ar).includes(nq) ||
        normalizeArabic(d.country_ar).includes(nq) ||
        d.code.toLowerCase().includes(q)
    );

    return { pills, matchedCountry };
  }, [destinations, pillQuery]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

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

  const handleSearch = () => {
    if (!selectedDestination) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    const searchType = `from_${code === "ALP" ? "aleppo" : "damascus"}`;
    const params = new URLSearchParams();
    params.set("type", searchType);
    params.set("airport", code);
    params.set("destination", selectedDestination);
    params.set("date", dateStr);
    navigate(`/search?${params.toString()}`);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  // Lock body scroll when calendar modal is open
  useEffect(() => {
    document.body.style.overflow = showCalendar ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCalendar]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCalendar) setShowCalendar(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showCalendar]);

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

        {/* Destination search */}
        <div className="explore-dest-search-wrap">
          <input
            value={pillQuery}
            onChange={(e) => setPillQuery(e.target.value)}
            placeholder="البحث عن وجهة أو دولة..."
            className="explore-dest-search"
          />
          {pillQuery && (
            <button
              className="explore-dest-search-clear"
              onClick={() => setPillQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Country badge */}
        {filteredPills.matchedCountry && (
          <div className="explore-pills-country-badge">
            {filteredPills.matchedCountry}
            <span className="explore-pills-country-count">
              — {filteredPills.pills.length}{" "}
              {filteredPills.pills.length > 2
                ? "مدن"
                : filteredPills.pills.length === 2
                  ? "وجهتان"
                  : "وجهة"}
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
                {d.airport_name_ar} ({d.code})
              </button>
            ))}
          </div>
        </div>

        {/* Date picker + Search CTA */}
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "0 16px 20px",
          }}
        >
          {/* Date selector */}
          <button
            className="explore-date-btn"
            onClick={() => {
              setCalMonth(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  1
                )
              );
              setShowCalendar(true);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid hsl(var(--border))",
              background: "hsl(var(--background))",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
              marginBottom: 12,
            }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="hsl(215 16% 47%)"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="18" rx="2.5" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "hsl(215 16% 55%)",
                  fontWeight: 500,
                }}
              >
                تاريخ المغادرة
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "hsl(var(--foreground))",
                }}
              >
                {format(selectedDate, "d MMMM yyyy", { locale: ar })}
              </span>
            </div>
          </button>

          {/* Search CTA */}
          <button
            onClick={handleSearch}
            disabled={!selectedDestination}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: "none",
              background: selectedDestination
                ? "hsl(var(--primary))"
                : "hsl(var(--muted))",
              color: selectedDestination
                ? "#fff"
                : "hsl(var(--muted-foreground))",
              fontSize: 16,
              fontWeight: 700,
              cursor: selectedDestination ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            <Search className="h-5 w-5" />
            {selectedDestination ? "البحث عن رحلات" : "اختر وجهة للبحث"}
          </button>

          {!selectedDestination && (
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "hsl(var(--muted-foreground))",
                marginTop: 8,
              }}
            >
              اختر وجهة من القائمة أعلاه ثم اختر التاريخ للبحث
            </p>
          )}
        </div>

        {/* Calendar Modal */}
        {showCalendar && (
          <div
            className="syria-ov"
            role="dialog"
            aria-modal="true"
            aria-label="اختيار التاريخ"
            onClick={() => setShowCalendar(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 100,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "hsl(var(--background))",
                borderRadius: "20px 20px 0 0",
                padding: "16px 16px 24px",
                width: "100%",
                maxWidth: 440,
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: "hsl(var(--border))",
                  margin: "0 auto 12px",
                }}
              />
              <span
                style={{
                  display: "block",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 12,
                }}
              >
                تاريخ المغادرة
              </span>

              {/* Month navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px 8px",
                }}
              >
                <button
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "hsl(var(--secondary))",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() =>
                    setCalMonth(
                      (m) =>
                        new Date(m.getFullYear(), m.getMonth() - 1, 1)
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
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                  {format(calMonth, "MMMM yyyy", { locale: ar })}
                </span>
                <button
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "hsl(var(--secondary))",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() =>
                    setCalMonth(
                      (m) =>
                        new Date(m.getFullYear(), m.getMonth() + 1, 1)
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

              {/* Week day labels */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 2,
                  marginBottom: 4,
                }}
              >
                {weekDayLabels.map((d) => (
                  <span
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "hsl(var(--muted-foreground))",
                      padding: "6px 0",
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar days */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                }}
              >
                {calDays.map((d, i) => {
                  if (d === null) return <span key={`e${i}`} />;
                  const date = new Date(
                    calMonth.getFullYear(),
                    calMonth.getMonth(),
                    d
                  );
                  const isPast = date.getTime() < today.getTime();
                  const isSelected =
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  const isToday = date.getTime() === today.getTime();
                  return (
                    <button
                      key={d}
                      disabled={isPast}
                      style={{
                        height: 44,
                        borderRadius: 10,
                        border: isSelected
                          ? "2px solid hsl(var(--primary))"
                          : "none",
                        background: isSelected
                          ? "hsl(217 91% 95%)"
                          : "transparent",
                        color: isPast
                          ? "hsl(var(--muted-foreground))"
                          : "hsl(var(--foreground))",
                        fontWeight: isToday || isSelected ? 700 : 500,
                        fontSize: 14,
                        cursor: isPast ? "default" : "pointer",
                        opacity: isPast ? 0.4 : 1,
                        fontFamily: "inherit",
                        textDecoration: isToday ? "underline" : "none",
                      }}
                      onClick={() => handleDateSelect(date)}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Explore;
