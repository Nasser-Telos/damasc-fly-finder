import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useBooking } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPrice, formatDuration } from "@/lib/formatters";
import { fetchOfferById } from "@/lib/api";
import type { BookingPassenger, LiveFlight } from "@/types/flight";
import type { CurrencyCode } from "@/lib/currency";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import "./Book.css";

export default function BookPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currency } = useCurrency();
  const [ready, setReady] = useState(false);

  // Flight details passed via route state
  const routeFlight = (location.state as { flight?: LiveFlight })?.flight ?? null;
  const [fetchedFlight, setFetchedFlight] = useState<LiveFlight | null>(null);
  const [fetchingOffer, setFetchingOffer] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const flight = routeFlight || fetchedFlight;

  const { book, isBooking, bookingResult, error, reset } = useBooking();

  // Fetch offer details on mount if flight data wasn't passed via route state
  useEffect(() => {
    if (routeFlight || !offerId) return;

    let cancelled = false;
    setFetchingOffer(true);
    setFetchError(null);

    fetchOfferById(offerId)
      .then((offer: Record<string, unknown>) => {
        if (cancelled) return;
        const slices = offer.slices as Array<Record<string, unknown>> | undefined;
        const slice = slices?.[0];
        const segments = slice?.segments as Array<Record<string, unknown>> | undefined;
        if (!segments?.length) throw new Error('العرض غير صالح أو منتهي الصلاحية');

        const firstSeg = segments[0] as Record<string, unknown>;
        const lastSeg = segments[segments.length - 1] as Record<string, unknown>;
        const origin = firstSeg.origin as { iata_code: string; name: string };
        const destination = (lastSeg.destination as { iata_code: string; name: string });
        const opCarrier = firstSeg.operating_carrier as { name: string; iata_code: string; logo_symbol_url?: string | null };
        const mkCarrier = firstSeg.marketing_carrier as { iata_code: string; logo_symbol_url?: string | null; flight_number?: string };

        const durationStr = (slice?.duration as string) || '';
        const dm = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const totalDuration = dm
          ? parseInt(dm[1] || '0') * 60 + parseInt(dm[2] || '0') + (parseInt(dm[3] || '0') >= 30 ? 1 : 0)
          : 0;

        const extractTime = (dt: string) => { const t = dt.indexOf('T'); return t >= 0 ? dt.slice(t + 1, t + 6) : dt; };

        setFetchedFlight({
          id: offer.id as string,
          flightLegs: [],
          totalDuration,
          price: parseFloat(offer.total_amount as string),
          currency: offer.total_currency as string,
          stops: segments.length - 1,
          departureTime: extractTime(firstSeg.departing_at as string),
          arrivalTime: extractTime((lastSeg.arriving_at as string)),
          departureAirport: { name: origin.name, id: origin.iata_code },
          arrivalAirport: { name: destination.name, id: destination.iata_code },
          airlineName: opCarrier.name,
          airlineLogo: opCarrier.logo_symbol_url || mkCarrier.logo_symbol_url || '',
          airlineCode: mkCarrier.iata_code,
          flightNumber: `${mkCarrier.iata_code} ${(firstSeg as Record<string, unknown>).marketing_carrier_flight_number || ''}`.trim(),
          offerId: offer.id as string,
          isBest: false,
        });
      })
      .catch((err) => {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : 'فشل تحميل تفاصيل العرض');
      })
      .finally(() => {
        if (!cancelled) setFetchingOffer(false);
      });

    return () => { cancelled = true; };
  }, [routeFlight, offerId]);

  // Form state
  const [form, setForm] = useState<BookingPassenger>({
    given_name: '',
    family_name: '',
    born_on: '',
    email: '',
    phone_number: '',
    gender: 'm',
    title: 'mr',
  });

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  const updateField = (field: keyof BookingPassenger, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) reset();
  };

  const isFormValid =
    form.given_name.trim() &&
    form.family_name.trim() &&
    form.born_on &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    /^\+?[\d\s\-()]{7,}$/.test(form.phone_number.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerId || !isFormValid) return;
    book({
      offer_id: offerId,
      passengers: [form],
    });
  };

  if (!offerId) {
    return (
      <div dir="rtl" className={`book-root ${ready ? "book-on" : ""}`}>
        <header className="book-header">
          <button className="book-back" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="book-header-info">
            <div className="book-header-title">خطأ</div>
          </div>
        </header>
        <div className="book-content" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p>معرّف العرض غير متوفر</p>
          <button className="book-submit" style={{ marginTop: 16, maxWidth: 200, margin: '16px auto' }} onClick={() => navigate('/')}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`book-root ${ready ? "book-on" : ""}`}>
      {/* Header */}
      <header className="book-header">
        <button className="book-back" onClick={() => navigate(-1)}>
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="book-header-info">
          <div className="book-header-title">إتمام الحجز</div>
          <div className="book-header-sub">أدخل بيانات المسافر لإتمام الحجز</div>
        </div>
      </header>

      <div className="book-content">
        {/* Loading offer details on direct navigation */}
        {fetchingOffer && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <LoadingSpinner text="جاري تحميل تفاصيل العرض..." size="sm" />
          </div>
        )}

        {/* Error fetching offer */}
        {fetchError && !fetchingOffer && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ color: 'hsl(0 70% 50%)', marginBottom: 12 }}>{fetchError}</p>
            <button className="book-submit" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => navigate('/')}>
              العودة للرئيسية
            </button>
          </div>
        )}

        {/* Flight Summary */}
        {flight && (
          <div className="book-summary">
            <div className="book-summary-row">
              <div className="book-summary-logo">
                {flight.airlineLogo ? (
                  <img src={flight.airlineLogo} alt={flight.airlineName} />
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(217 91% 50%)' }}>{flight.airlineCode}</span>
                )}
              </div>
              <span className="book-summary-airline">{flight.airlineName}</span>
              <span className="book-summary-flight">{flight.flightNumber}</span>
            </div>
            <div className="book-summary-row">
              <span className="book-summary-route">
                {flight.departureAirport.id} → {flight.arrivalAirport.id}
              </span>
              <span style={{ fontSize: 13, color: 'hsl(215 16% 55%)' }}>
                {flight.departureTime} - {flight.arrivalTime} · {formatDuration(flight.totalDuration)}
              </span>
            </div>
            {flight.stops > 0 && (
              <div className="book-summary-row">
                <span style={{ fontSize: 12, color: 'hsl(25 90% 45%)' }}>
                  {flight.stops} توقف
                </span>
              </div>
            )}
            <div className="book-summary-price">
              {formatPrice(flight.price, (flight.currency || currency) as CurrencyCode)}
            </div>
          </div>
        )}

        {/* Booking Success */}
        {bookingResult ? (
          <div className="book-success">
            <div className="book-success-icon">&#9989;</div>
            <div className="book-success-title">تم الحجز بنجاح!</div>
            <div className="book-success-ref">{bookingResult.booking_reference}</div>
            <div className="book-success-detail">رقم الطلب: {bookingResult.order_id}</div>
            <div className="book-success-detail">الحالة: {bookingResult.status}</div>
            <button
              className="book-submit"
              style={{ marginTop: 20, maxWidth: 240 }}
              onClick={() => navigate('/')}
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <>
            {/* Passenger Form */}
            <div className="book-section-title">بيانات المسافر</div>

            {error && (
              <div className="book-error">{error.message}</div>
            )}

            <form className="book-form" onSubmit={handleSubmit}>
              <div className="book-row">
                <div className="book-field">
                  <label>الاسم الأول (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="مثال: Ahmed"
                    value={form.given_name}
                    onChange={e => updateField('given_name', e.target.value)}
                    required
                  />
                </div>
                <div className="book-field">
                  <label>اسم العائلة (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="مثال: Al-Hassan"
                    value={form.family_name}
                    onChange={e => updateField('family_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="book-row">
                <div className="book-field">
                  <label>تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={form.born_on}
                    onChange={e => updateField('born_on', e.target.value)}
                    required
                  />
                </div>
                <div className="book-field">
                  <label>الجنس</label>
                  <select
                    value={form.gender}
                    onChange={e => updateField('gender', e.target.value)}
                  >
                    <option value="m">ذكر</option>
                    <option value="f">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="book-field">
                <label>اللقب</label>
                <select
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                >
                  <option value="mr">السيد (Mr)</option>
                  <option value="ms">الآنسة (Ms)</option>
                  <option value="mrs">السيدة (Mrs)</option>
                </select>
              </div>

              <div className="book-field">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <div className="book-field">
                <label>رقم الهاتف</label>
                <input
                  type="tel"
                  placeholder="+963 xxx xxx xxx"
                  value={form.phone_number}
                  onChange={e => updateField('phone_number', e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="book-submit"
                disabled={!isFormValid || isBooking}
              >
                {isBooking ? (
                  <LoadingSpinner text="جاري إنشاء الحجز..." size="sm" />
                ) : (
                  "تأكيد الحجز"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
