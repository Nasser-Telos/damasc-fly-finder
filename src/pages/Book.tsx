import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useBooking } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPrice, formatDuration } from "@/lib/formatters";
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
  const flight = (location.state as { flight?: LiveFlight })?.flight ?? null;

  const { book, isBooking, bookingResult, error, reset } = useBooking();

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
    if (!flight?.rawOffer || !isFormValid) return;
    book({
      offer: flight.rawOffer,
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

  // No route state — session expired (Amadeus offers can't be fetched by ID)
  if (!flight) {
    return (
      <div dir="rtl" className={`book-root ${ready ? "book-on" : ""}`}>
        <header className="book-header">
          <button className="book-back" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="book-header-info">
            <div className="book-header-title">انتهت الصلاحية</div>
          </div>
        </header>
        <div className="book-content" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p>انتهت صلاحية العرض. يرجى البحث مرة أخرى.</p>
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
        {/* Flight Summary */}
        <div className="book-summary">
          <div className="book-summary-row">
            <div className="book-summary-logo">
              {flight.airlineLogo ? (
                <img
                  src={flight.airlineLogo}
                  alt={flight.airlineName}
                  onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; if (img.parentElement) { img.parentElement.innerHTML = `<span style="font-size: 11px; font-weight: 700; color: hsl(217 91% 50%)">${flight.airlineCode}</span>`; } }}
                />
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

        {/* Booking Success */}
        {bookingResult ? (
          <div className="book-success">
            <div className="book-success-icon">&#9989;</div>
            <div className="book-success-title">تم الحجز بنجاح!</div>
            {bookingResult.booking_reference && (
              <div className="book-success-ref">{bookingResult.booking_reference}</div>
            )}
            {bookingResult.order_id && (
              <div className="book-success-detail">رقم الطلب: {bookingResult.order_id}</div>
            )}
            <div className="book-success-detail">الحالة: {bookingResult.status === 'confirmed' ? 'مؤكد' : 'قيد المعالجة'}</div>
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
                disabled={!isFormValid || isBooking || !flight.rawOffer}
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
