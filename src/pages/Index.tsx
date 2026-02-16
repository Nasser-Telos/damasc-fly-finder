import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Loader2 } from "lucide-react";
import { useDestinations } from "@/hooks/useFlights";
import { ExploreDealsSection } from "@/components/flight/ExploreDealsSection";

import type { Destination } from "@/types/flight";
import { filterDestinations } from "@/lib/destinationFilter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { countryGeoMapping, DEFAULT_GEO } from "@/lib/geoMapping";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import syriaHeroImage from "@/assets/syria-hero-illustration.webp";
import "./Index.css";

type AirportTab = 'dam' | 'alp';

const Index = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userCityNameDirect, setUserCityNameDirect] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [dir, setDir] = useState<'to' | 'from'>('to');
  const [picker, setPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [menu, setMenu] = useState<string | null>(null);
  const [airportPicker, setAirportPicker] = useState(false);
  const [tab, setTab] = useState<AirportTab>('dam');
  const [q, setQ] = useState('');
  const [ready, setReady] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());

  const { data: destinations } = useDestinations();
  const { currency, setCurrency, symbol } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // Non-Syrian destinations (show all active, not just those with flights)
  const otherDestinations = useMemo(() => {
    if (!destinations) return [];
    return destinations.filter(
      d => d.airport_code !== 'DAM' && d.airport_code !== 'ALP'
    );
  }, [destinations]);

  // Filtered destinations for search
  const filterResult = useMemo(() => {
    return filterDestinations(otherDestinations, q);
  }, [otherDestinations, q]);

  // Detect user location
  useEffect(() => {
    const controller = new AbortController();

    const applyCountry = (countryCode: string | null) => {
      if (countryCode === 'SY') {
        setUserLocation(DEFAULT_GEO.airportCode);
        localStorage.setItem('userAirport', DEFAULT_GEO.airportCode);
        setDir('from');
      } else if (countryCode && countryGeoMapping[countryCode]) {
        const geo = countryGeoMapping[countryCode];
        setUserLocation(geo.airportCode);
        localStorage.setItem('userAirport', geo.airportCode);
      } else {
        setUserLocation(DEFAULT_GEO.airportCode);
        localStorage.setItem('userAirport', DEFAULT_GEO.airportCode);
      }
    };

    const detectLocation = async () => {
      try {
        // Primary: Cloudflare Pages Function (production)
        const res = await fetch('/api/geo', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('geo endpoint failed');
        const data = await res.json();
        applyCountry(data.country_code);
      } catch {
        try {
          // Fallback: ipwho.is (works during local dev)
          const res = await fetch('https://ipwho.is/', {
            signal: controller.signal,
            cache: 'no-store',
          });
          if (!res.ok) throw new Error('ipwho.is failed');
          const data = await res.json();
          applyCountry(data.country_code);
        } catch {
          // Final fallback
          applyCountry(null);
        }
      } finally {
        setIsDetecting(false);
      }
    };

    detectLocation();
    return () => controller.abort();
  }, []);

  // Ready animation
  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Escape key closes modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (picker) { setPicker(false); setQ(''); }
        else if (airportPicker) { setAirportPicker(false); }
        else if (menu) { setMenu(null); }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [picker, airportPicker, menu]);

  // Lock body scroll when modals are open
  useEffect(() => {
    const isOpen = picker || airportPicker || menu === "depart";
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [picker, airportPicker, menu]);

  const userDestination = useMemo(() => {
    return destinations?.find(d => d.airport_code === userLocation);
  }, [destinations, userLocation]);

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

  const weekDayLabels = ['سب', 'أح', 'اث', 'ثل', 'أر', 'خم', 'جم'];

  const airportName = tab === 'dam' ? 'مطار دمشق الدولي' : 'مطار حلب الدولي';
  const airportCode = tab === 'dam' ? 'DAM' : 'ALP';
  const city = userCityNameDirect || userDestination?.airport_name_ar || (isDetecting ? 'جاري التحديد...' : 'اختر وجهة');
  const cc = userLocation || '';

  const handleSelectCity = (dest: Destination) => {
    setUserLocation(dest.airport_code);
    localStorage.setItem('userAirport', dest.airport_code);
    setUserCityNameDirect(dest.airport_name_ar);
    setPicker(false);
    setQ('');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setMenu(null);
  };

  const handleSearch = () => {
    const searchType = dir === 'to' ? `to_${tab === 'dam' ? 'damascus' : 'aleppo'}` : `from_${tab === 'dam' ? 'damascus' : 'aleppo'}`;
    const params = new URLSearchParams();
    params.set("type", searchType);
    params.set("airport", airportCode);
    if (userLocation) params.set("destination", userLocation);
    if (selectedDate) params.set("date", selectedDate.toISOString().split("T")[0]);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div dir="rtl" onClick={() => setMenu(null)}>
      <div className={`syria-root ${ready ? "root-on" : ""}`}>


        {/* HEADER */}
        <header className="syria-hdr">
          <div className="syria-hdr-in">
            <div className="syria-logo">
              <div className="syria-logo-icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2L16 11l3.5-3.5C21 6 21.5 4 21 3z" fill="currentColor"/>
                </svg>
              </div>
              <span className="syria-logo-name">رحلات سوريا</span>
            </div>
            <nav className="syria-nav">
              {[
                { id: "dam" as AirportTab, l: "من وإلى دمشق" },
                { id: "alp" as AirportTab, l: "من وإلى حلب" },
              ].map(t => (
                <button
                  key={t.id}
                  className={`syria-nav-btn ${tab === t.id ? "syria-nav-on" : ""}`}
                  onClick={e => { e.stopPropagation(); setTab(t.id); }}
                >
                  {t.l}
                  {tab === t.id && <span className="syria-nav-bar" />}
                </button>
              ))}
              <div className="syria-currency-wrap" style={{ position: 'relative', marginRight: 'auto' }}>
                <button
                  className="syria-currency-btn"
                  onClick={e => { e.stopPropagation(); setCurrencyOpen(!currencyOpen); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid hsl(215 20% 85%)',
                    background: 'hsl(215 30% 97%)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: 'hsl(215 25% 30%)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {symbol} {currency}
                </button>
                {currencyOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      marginTop: 4,
                      background: 'white',
                      border: '1px solid hsl(215 20% 88%)',
                      borderRadius: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      zIndex: 100,
                      minWidth: 170,
                      overflow: 'hidden',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map(code => (
                      <button
                        key={code}
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          border: 'none',
                          background: currency === code ? 'hsl(215 30% 95%)' : 'transparent',
                          fontWeight: currency === code ? 600 : 400,
                          cursor: 'pointer',
                          color: 'hsl(215 25% 20%)',
                        }}
                        onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                      >
                        {CURRENCIES[code].symbol} {code} — {CURRENCIES[code].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </header>

        {/* HERO ILLUSTRATION */}
        <div className="syria-hero-img-wrap">
          <img src={syriaHeroImage} alt="سوريا" className="syria-hero-img" />
        </div>

        {/* HERO TEXT */}
        <div className="syria-hero">
          <h1 className="syria-h1">كل شركات الطيران... بنقرة واحدة</h1>
          <p className="syria-hero-sub">ابحث مرة. قارن الكل. احجز الأفضل.</p>
        </div>

        {/* SEARCH CARD */}
        <div className="syria-card-area" onClick={e => e.stopPropagation()}>
          <div className="syria-card">

            {/* Route fields */}
            <div className="syria-form">
              <div className="syria-route-box">
                <button
                  className="syria-inp syria-inp-from"
                  onClick={() => dir === "to" ? setPicker(true) : setAirportPicker(true)}
                >
                  <div className="syria-inp-ring"><div className="syria-inp-dot" /></div>
                  <div className="syria-inp-col">
                    <span className="syria-inp-label">من</span>
                    <span className="syria-inp-value">{dir === "to" ? city : airportName}</span>
                  </div>
                  <span className="syria-inp-code">{dir === "to" ? cc : airportCode}</span>
                </button>

                <div className="syria-swap-zone">
                  <button className="syria-swap-circle" onClick={e => { e.stopPropagation(); setDir(d => d === "to" ? "from" : "to"); }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                <button
                  className="syria-inp"
                  onClick={() => dir === "from" ? setPicker(true) : setAirportPicker(true)}
                >
                  <svg className="syria-inp-pin" width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path d="M20 10c0 4.418-8 14-8 14s-8-9.582-8-14a8 8 0 1116 0z" fill="hsl(217 91% 92%)" stroke="hsl(217 91% 60%)" strokeWidth="1.5" />
                    <circle cx="12" cy="10" r="2.5" fill="hsl(217 91% 60%)" />
                  </svg>
                  <div className="syria-inp-col">
                    <span className="syria-inp-label">إلى</span>
                    <span className="syria-inp-value">{dir === "from" ? city : airportName}</span>
                  </div>
                  <span className="syria-inp-code">{dir === "from" ? cc : airportCode}</span>
                </button>
              </div>

              {/* Dates */}
              <div className="syria-date-boxes">
                <button className="syria-date-inp" onClick={() => {
                  setCalMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                  setMenu("depart");
                }}>
                  <svg width="20" height="20" fill="none" stroke="hsl(215 16% 47%)" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2.5" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div className="syria-inp-col">
                    <span className="syria-inp-label">المغادرة</span>
                    <span className="syria-inp-value syria-date-value">
                      {format(selectedDate, "d MMMM yyyy", { locale: ar })}
                    </span>
                  </div>
                </button>
              </div>

              {/* Loading */}
              {isDetecting && (
                <div className="syria-loading">
                  <Loader2 className="h-4 w-4 animate-spin syria-loading-icon" />
                  <span>جاري تحديد موقعك...</span>
                </div>
              )}

              {/* CTA */}
              <button className="syria-cta" onClick={handleSearch}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                البحث عن رحلات
              </button>
            </div>
          </div>
        </div>

        {/* EXPLORE */}
        <ExploreDealsSection 
          navigate={navigate}
          userLocation={userLocation}
          userCityName={userCityNameDirect || userDestination?.airport_name_ar || null}
          isDetecting={isDetecting}
        />

        {/* CITY PICKER */}
        {picker && (
          <div className="syria-ov" role="dialog" aria-modal="true" aria-label="اختيار المدينة" onClick={() => { setPicker(false); setQ(''); }}>
            <div className="syria-sheet" onClick={e => e.stopPropagation()}>
              <div className="syria-sh-bar"><div className="syria-sh-handle" /></div>
              <div className="syria-sh-head">
                <input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="البحث عن مدينة..."
                  className="syria-sh-q"
                />
                <button className="syria-sh-x" onClick={() => { setPicker(false); setQ(''); }}>إلغاء</button>
              </div>
              <div className="syria-sh-body">
                {filterResult.destinations.length === 0 ? (
                  <div className="syria-sh-none">لا توجد نتائج</div>
                ) : (
                  <>
                    {filterResult.matchedCountry && (
                      <div className="syria-sh-country-header">
                        <span className="syria-sh-country-badge">{filterResult.matchedCountry}</span>
                        <span className="syria-sh-country-count">
                          {filterResult.destinations.length} {filterResult.destinations.length > 2 ? 'مدن' : filterResult.destinations.length === 2 ? 'مدينتان' : 'مدينة'}
                        </span>
                      </div>
                    )}
                    {filterResult.destinations.map(dest => (
                      <button
                        key={dest.id}
                        className={`syria-sh-row ${userLocation === dest.airport_code ? "syria-sh-act" : ""}${dest.isCountryMatch ? " syria-sh-country-match" : ""}`}
                        onClick={() => handleSelectCity(dest)}
                      >
                        <div className="syria-sh-icon">
                          <Plane className="h-5 w-5" style={{ color: "hsl(215 16% 47%)" }} />
                        </div>
                        <div className="syria-sh-col">
                          <span className="syria-sh-n">{dest.airport_name_ar}</span>
                          <span className="syria-sh-c">{dest.city_ar} · {dest.country_ar}</span>
                        </div>
                        <span className="syria-sh-cd">{dest.airport_code}</span>
                        {userLocation === dest.airport_code && (
                          <svg width="18" height="18" fill="none" stroke="hsl(217 91% 60%)" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* AIRPORT PICKER */}
        {airportPicker && (
          <div className="syria-ov" role="dialog" aria-modal="true" aria-label="اختيار المطار" onClick={() => setAirportPicker(false)}>
            <div className="syria-sheet" onClick={e => e.stopPropagation()}>
              <div className="syria-sh-bar"><div className="syria-sh-handle" /></div>
              <div className="syria-sh-head">
                <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'hsl(215 25% 15%)' }}>اختر المطار</span>
                <button className="syria-sh-x" onClick={() => setAirportPicker(false)}>إلغاء</button>
              </div>
              <div className="syria-sh-body">
                {([
                  { id: 'dam' as AirportTab, name: 'مطار دمشق الدولي', city: 'دمشق', code: 'DAM', country: 'سوريا' },
                  { id: 'alp' as AirportTab, name: 'مطار حلب الدولي', city: 'حلب', code: 'ALP', country: 'سوريا' },
                ] as const).map(airport => (
                  <button
                    key={airport.id}
                    className={`syria-sh-row ${tab === airport.id ? "syria-sh-act" : ""}`}
                    onClick={() => { setTab(airport.id); setAirportPicker(false); }}
                  >
                    <div className="syria-sh-icon">
                      <Plane className="h-5 w-5" style={{ color: "hsl(215 16% 47%)" }} />
                    </div>
                    <div className="syria-sh-col">
                      <span className="syria-sh-n">{airport.name}</span>
                      <span className="syria-sh-c">{airport.city} · {airport.country}</span>
                    </div>
                    <span className="syria-sh-cd">{airport.code}</span>
                    {tab === airport.id && (
                      <svg width="18" height="18" fill="none" stroke="hsl(217 91% 60%)" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* DATE PICKER */}
        {menu === "depart" && (
          <div className="syria-ov" role="dialog" aria-modal="true" aria-label="اختيار التاريخ" onClick={() => setMenu(null)}>
            <div className="syria-cal-sheet" onClick={e => e.stopPropagation()}>
              <div className="syria-sh-bar"><div className="syria-sh-handle" /></div>
              <span className="syria-pop-title">تاريخ المغادرة</span>
              <div className="syria-cal-nav">
                <button className="syria-cal-arrow" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <span className="syria-cal-month">{format(calMonth, "MMMM yyyy", { locale: ar })}</span>
                <button className="syria-cal-arrow" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>
              <div className="syria-cal-grid">
                {weekDayLabels.map(d => (
                  <span key={d} className="syria-cal-wk">{d}</span>
                ))}
                {calDays.map((d, i) => {
                  if (d === null) return <span key={`e${i}`} />;
                  const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
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
                      className={`syria-cal-day${isSelected ? " syria-cal-sel" : ""}${isToday ? " syria-cal-today" : ""}`}
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
    </div>
  );
};

export default Index;
