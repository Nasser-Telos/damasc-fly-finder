import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Loader2 } from "lucide-react";
import { useDestinations, useDamascusFlights } from "@/hooks/useFlights";
import type { Destination } from "@/types/flight";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import syriaHeroImage from "@/assets/syria-hero-illustration.png";
import "./Index.css";

// Map countries to their likely airport codes
const countryToAirport: Record<string, string> = {
  'AE': 'DXB', 'QA': 'DOH', 'SA': 'JED', 'KW': 'KWI', 'BH': 'BAH',
  'OM': 'MCT', 'JO': 'AMM', 'LB': 'BEY', 'EG': 'CAI', 'TR': 'IST',
  'IQ': 'BGW', 'RU': 'SVO',
};

const cMap: Record<string, string> = {
  economy: "الدرجة الاقتصادية",
  premium: "اقتصادي ممتاز",
  business: "درجة الأعمال",
  first: "الدرجة الأولى",
};

type AirportTab = 'dam' | 'alp';

const Index = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [dir, setDir] = useState<'to' | 'from'>('to');
  const [picker, setPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pax, setPax] = useState(1);
  const [trip, setTrip] = useState<'roundtrip' | 'oneway'>('oneway');
  const [cabin, setCabin] = useState<string>('economy');
  const [menu, setMenu] = useState<string | null>(null);
  const [tab, setTab] = useState<AirportTab>('dam');
  const [q, setQ] = useState('');
  const [ready, setReady] = useState(false);

  const { data: destinations } = useDestinations();

  // Non-Syrian destinations for city picker
  const otherDestinations = useMemo(() => {
    return destinations?.filter(d => d.airport_code !== 'DAM' && d.airport_code !== 'ALP') || [];
  }, [destinations]);

  // Filtered destinations for search
  const filteredDestinations = useMemo(() => {
    if (!q) return otherDestinations;
    const lower = q.toLowerCase();
    return otherDestinations.filter(d =>
      d.city_ar.includes(q) ||
      d.city.toLowerCase().includes(lower) ||
      d.airport_code.toLowerCase().includes(lower) ||
      d.country_ar.includes(q)
    );
  }, [otherDestinations, q]);

  // Detect user location
  useEffect(() => {
    const controller = new AbortController();
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', { 
          signal: controller.signal,
          cache: 'force-cache'
        });
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data.country_code === 'SY') {
          setUserLocation('DXB');
          setDir('from');
        } else if (data.country_code && countryToAirport[data.country_code]) {
          setUserLocation(countryToAirport[data.country_code]);
        } else {
          setUserLocation('DXB');
        }
      } catch {
        setUserLocation('DXB');
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

  const userDestination = useMemo(() => {
    return destinations?.find(d => d.airport_code === userLocation);
  }, [destinations, userLocation]);

  const airportName = tab === 'dam' ? 'دمشق' : 'حلب';
  const airportCode = tab === 'dam' ? 'DAM' : 'ALP';
  const city = userDestination?.city_ar || (isDetecting ? 'جاري التحديد...' : 'اختر مدينة');
  const cc = userLocation || '';

  const handleSelectCity = (dest: Destination) => {
    setUserLocation(dest.airport_code);
    setPicker(false);
    setQ('');
  };

  const handleSearch = () => {
    const searchType = dir === 'to' ? `to_${tab === 'dam' ? 'damascus' : 'aleppo'}` : `from_${tab === 'dam' ? 'damascus' : 'aleppo'}`;
    const params = new URLSearchParams();
    params.set("type", searchType);
    params.set("airport", airportCode);
    if (userLocation) params.set("destination", userLocation);
    if (selectedDate) params.set("date", selectedDate.toISOString());
    params.set("passengers", pax.toString());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div dir="rtl" onClick={() => setMenu(null)}>
      <div className={`syria-root ${ready ? "root-on" : ""}`}>

        {/* Top gradient glow */}
        <div className="top-glow" />

        {/* HEADER */}
        <header className="syria-hdr">
          <div className="syria-hdr-in">
            <div className="syria-logo">
              <div className="syria-logo-mark">✈</div>
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
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginLeft: 6 }}>
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  </svg>
                  {t.l}
                  {tab === t.id && <span className="syria-nav-bar" />}
                </button>
              ))}
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

            {/* Option pills */}
            <div className="syria-pills">
              <button
                className={`syria-pill ${trip === "oneway" ? "syria-pill-on" : ""}`}
                onClick={() => setTrip("oneway")}
              >
                ذهاب فقط
              </button>
              <button
                className={`syria-pill ${trip === "roundtrip" ? "syria-pill-on" : ""}`}
                onClick={() => setTrip("roundtrip")}
              >
                ذهاب وعودة
              </button>
              <div className="syria-pill-sep" />
              <button
                className="syria-pill"
                onClick={e => { e.stopPropagation(); setMenu(menu === "pax" ? null : "pax"); }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                {pax}
              </button>
              {menu === "pax" && (
                <>
                  <div className="syria-pop-overlay" onClick={() => setMenu(null)} />
                  <div className="syria-pop syria-pop-pax" onClick={e => e.stopPropagation()}>
                    <span className="syria-pop-title">عدد المسافرين</span>
                    <div className="syria-stepper">
                      <button className="syria-step-btn" onClick={() => setPax(Math.max(1, pax - 1))} disabled={pax <= 1}>−</button>
                      <span className="syria-step-val">{pax}</span>
                      <button className="syria-step-btn" onClick={() => setPax(Math.min(9, pax + 1))} disabled={pax >= 9}>+</button>
                    </div>
                    <button className="syria-pop-done" onClick={() => setMenu(null)}>تأكيد</button>
                  </div>
                </>
              )}
              <button
                className="syria-pill"
                onClick={e => { e.stopPropagation(); setMenu(menu === "cabin" ? null : "cabin"); }}
              >
                {cMap[cabin]}
                <svg width="10" height="6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 6">
                  <path d="M1 1l4 4 4-4" />
                </svg>
              </button>
              {menu === "cabin" && (
                <>
                  <div className="syria-pop-overlay" onClick={() => setMenu(null)} />
                  <div className="syria-pop syria-pop-cabin" onClick={e => e.stopPropagation()}>
                    {Object.entries(cMap).map(([k, v]) => (
                      <button
                        key={k}
                        className={`syria-pop-opt ${cabin === k ? "syria-pop-sel" : ""}`}
                        onClick={() => { setCabin(k); setMenu(null); }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Route fields */}
            <div className="syria-form">
              <div className="syria-route-box">
                <button
                  className="syria-inp syria-inp-from"
                  onClick={() => dir === "to" && setPicker(true)}
                >
                  <div className="syria-inp-ring"><div className="syria-inp-dot" /></div>
                  <div className="syria-inp-col">
                    <span className="syria-inp-label">من</span>
                    <span className="syria-inp-value">{dir === "to" ? city : airportName}</span>
                  </div>
                  <span className="syria-inp-code">{dir === "to" ? cc : airportCode}</span>
                </button>

                <div className="syria-swap-zone">
                  <button className="syria-swap-circle" onClick={() => setDir(d => d === "to" ? "from" : "to")}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                <button
                  className="syria-inp"
                  onClick={() => dir === "from" && setPicker(true)}
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
                <button className="syria-date-inp">
                  <svg width="20" height="20" fill="none" stroke="hsl(215 16% 47%)" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2.5" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div className="syria-inp-col">
                    <span className="syria-inp-label">المغادرة</span>
                    <span className="syria-inp-value" style={{ fontSize: 15 }}>
                      {format(selectedDate, "d MMMM yyyy", { locale: ar })}
                    </span>
                  </div>
                </button>
                {trip === "roundtrip" && (
                  <button className="syria-date-inp syria-date-empty">
                    <svg width="20" height="20" fill="none" stroke="hsl(215 16% 65%)" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2.5" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <div className="syria-inp-col">
                      <span className="syria-inp-label">العودة</span>
                      <span style={{ fontSize: 15, color: "hsl(215 16% 65%)" }}>+ تاريخ العودة</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Loading */}
              {isDetecting && (
                <div className="syria-loading">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "hsl(217 91% 60%)" }} />
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
        <div className="syria-explore-sec">
          <div className="syria-explore-header">
            <h2 className="syria-explore-h2">🗺️ استكشف أرخص الرحلات</h2>
            <p className="syria-explore-desc">اعرف أفضل وقت للسفر بأقل سعر من خلال تقويم الأسعار الشهري</p>
          </div>
          {[
            { name: "دمشق", sub: "مطار دمشق الدولي", code: "DAM", badge: "DAM" },
            { name: "حلب", sub: "مطار حلب الدولي", code: "ALP", badge: "ALP" },
          ].map((a, i) => (
            <button
              key={a.name}
              className="syria-explore-row"
              style={{ animationDelay: `${400 + i * 80}ms` }}
              onClick={() => navigate(`/explore/${a.code}`)}
            >
              <div className="syria-explore-avi">
                <svg width="22" height="22" fill="none" stroke="hsl(217 91% 50%)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <div className="syria-explore-info">
                <span className="syria-explore-name">رحلات {a.name}</span>
                <span className="syria-explore-sub">{a.sub}</span>
              </div>
              <div className="syria-explore-badge">{a.badge}</div>
              <svg className="syria-explore-chevron" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ))}
        </div>

        <footer className="syria-ft">© {new Date().getFullYear()} رحلات سوريا · جميع الحقوق محفوظة</footer>

        {/* CITY PICKER */}
        {picker && (
          <div className="syria-ov" onClick={() => { setPicker(false); setQ(''); }}>
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
                {filteredDestinations.length === 0 ? (
                  <div className="syria-sh-none">لا توجد نتائج</div>
                ) : (
                  filteredDestinations.map(dest => (
                    <button
                      key={dest.id}
                      className={`syria-sh-row ${userLocation === dest.airport_code ? "syria-sh-act" : ""}`}
                      onClick={() => handleSelectCity(dest)}
                    >
                      <div className="syria-sh-icon">
                        <Plane className="h-5 w-5" style={{ color: "hsl(215 16% 47%)" }} />
                      </div>
                      <div className="syria-sh-col">
                        <span className="syria-sh-n">{dest.city_ar}</span>
                        <span className="syria-sh-c">{dest.country_ar}</span>
                      </div>
                      <span className="syria-sh-cd">{dest.airport_code}</span>
                      {userLocation === dest.airport_code && (
                        <svg width="18" height="18" fill="none" stroke="hsl(217 91% 60%)" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
