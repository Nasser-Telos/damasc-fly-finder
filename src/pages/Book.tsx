import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Plane, Clock, User, FileText, AlertCircle, MapPin } from "lucide-react";
import { useBooking } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPrice, formatDuration } from "@/lib/formatters";
import { getAirlineArabicName } from "@/lib/airlineLookup";
import type { BookingPassenger, LiveFlight } from "@/types/flight";
import type { CurrencyCode } from "@/lib/currency";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import "./Book.css";

function getTravelClassArabic(travelClass: string): string {
  const map: Record<string, string> = {
    ECONOMY: "اقتصادي",
    PREMIUM_ECONOMY: "اقتصادي مميز",
    BUSINESS: "رجال أعمال",
    FIRST: "الدرجة الأولى",
  };
  return map[travelClass?.toUpperCase()] || travelClass || "اقتصادي";
}

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
    passport_number: '',
    passport_expiry: '',
    nationality: 'SY',
    issuance_country: 'SY',
    address_line: '',
    city: '',
    postal_code: '',
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
    /^\+?[\d\s\-()]{7,}$/.test(form.phone_number.trim()) &&
    form.passport_number.trim() &&
    form.passport_expiry &&
    /^[A-Z]{2}$/.test(form.nationality) &&
    /^[A-Z]{2}$/.test(form.issuance_country);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flight?.rawOffer || !isFormValid) return;
    book({
      offer: flight.rawOffer,
      passengers: [form],
    });
  };

  // Current step for progress indicator
  const currentStep = bookingResult ? 3 : 2;

  // -- Error state: no offerId --
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
        <div className="book-content">
          <div className="book-state-card book-state-error">
            <AlertCircle className="book-state-icon" />
            <div className="book-state-title">معرّف العرض غير متوفر</div>
            <div className="book-state-desc">يرجى العودة والمحاولة مرة أخرى</div>
            <button className="book-submit book-state-cta" onClick={() => navigate('/')}>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- Expired state: no flight data --
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
        <div className="book-content">
          <div className="book-state-card book-state-expired">
            <Clock className="book-state-icon" />
            <div className="book-state-title">انتهت صلاحية العرض</div>
            <div className="book-state-desc">يرجى البحث مرة أخرى للحصول على أسعار محدّثة</div>
            <button className="book-submit book-state-cta" onClick={() => navigate('/')}>
              العودة للبحث
            </button>
          </div>
        </div>
      </div>
    );
  }

  const airlineAr = getAirlineArabicName(flight.airlineCode) || flight.airlineName;
  const travelClass = flight.flightLegs?.[0]?.travel_class;
  const departureCityAr = flight.originDestination?.city_ar || flight.departureAirport.name;
  const arrivalCityAr = flight.arrivalDestination?.city_ar || flight.arrivalAirport.name;

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
        {/* Flight Summary with Route Visualization */}
        <div className="book-summary book-stagger-0">
          {/* Airline row */}
          <div className="book-summary-top">
            <div className="book-summary-logo">
              {flight.airlineLogo ? (
                <img
                  src={flight.airlineLogo}
                  alt={airlineAr}
                  onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; if (img.parentElement) { img.parentElement.innerHTML = `<span style="font-size: 11px; font-weight: 700; color: hsl(217 91% 50%)">${flight.airlineCode}</span>`; } }}
                />
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(217 91% 50%)' }}>{flight.airlineCode}</span>
              )}
            </div>
            <div className="book-summary-airline-info">
              <span className="book-summary-airline">{airlineAr}</span>
              <span className="book-summary-flight">{flight.flightNumber}</span>
            </div>
            {travelClass && (
              <span className="book-summary-class">{getTravelClassArabic(travelClass)}</span>
            )}
          </div>

          {/* Route visualization */}
          <div className="book-route">
            <div className="book-route-point">
              <span className="book-route-time">{flight.departureTime}</span>
              <span className="book-route-city">{departureCityAr}</span>
              <span className="book-route-code">{flight.departureAirport.id}</span>
            </div>

            <div className="book-route-middle">
              <span className="book-route-duration">
                <Clock className="h-3 w-3" />
                {formatDuration(flight.totalDuration)}
              </span>
              <div className="book-route-line">
                <span className="book-route-dot" />
                <div className="book-route-line-bar" />
                <Plane className="h-3.5 w-3.5 -rotate-90" style={{ color: "hsl(217 91% 60%)", margin: "0 4px" }} />
                <div className="book-route-line-bar" />
                <span className="book-route-dot" />
              </div>
              <span className={`book-route-stops${flight.stops > 0 ? " book-route-stops-transfer" : ""}`}>
                {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
              </span>
            </div>

            <div className="book-route-point">
              <span className="book-route-time">{flight.arrivalTime}</span>
              <span className="book-route-city">{arrivalCityAr}</span>
              <span className="book-route-code">{flight.arrivalAirport.id}</span>
            </div>
          </div>

          {/* Price */}
          <div className="book-summary-price">
            {formatPrice(flight.price, (flight.currency || currency) as CurrencyCode)}
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="book-steps book-stagger-1">
          <div className={`book-step ${currentStep >= 1 ? "book-step-done" : ""}`}>
            <span className="book-step-circle">1</span>
            <span className="book-step-label">تفاصيل الرحلة</span>
          </div>
          <div className="book-step-connector" />
          <div className={`book-step ${currentStep === 2 ? "book-step-active" : ""} ${currentStep > 2 ? "book-step-done" : ""}`}>
            <span className="book-step-circle">2</span>
            <span className="book-step-label">بيانات المسافر</span>
          </div>
          <div className="book-step-connector" />
          <div className={`book-step ${currentStep >= 3 ? "book-step-done" : ""}`}>
            <span className="book-step-circle">3</span>
            <span className="book-step-label">التأكيد</span>
          </div>
        </div>

        {/* Booking Success */}
        {bookingResult ? (
          <div className="book-success book-stagger-2">
            <div className="book-success-check">
              <svg className="book-check-svg" viewBox="0 0 52 52">
                <circle className="book-check-circle" cx="26" cy="26" r="24" fill="none" />
                <path className="book-check-path" fill="none" d="M14 27l7.8 7.8L38 17" />
              </svg>
            </div>
            <div className="book-success-title book-success-reveal" style={{ animationDelay: '0.5s' }}>تم الحجز بنجاح!</div>
            {bookingResult.booking_reference && (
              <div className="book-success-reveal" style={{ animationDelay: '0.65s' }}>
                <div className="book-success-ref-label">رقم الحجز</div>
                <div className="book-success-ref">{bookingResult.booking_reference}</div>
              </div>
            )}
            {bookingResult.order_id && (
              <div className="book-success-detail book-success-reveal" style={{ animationDelay: '0.8s' }}>
                رقم الطلب: {bookingResult.order_id}
              </div>
            )}
            <div className="book-success-detail book-success-reveal" style={{ animationDelay: '0.95s' }}>
              الحالة: {bookingResult.status === 'confirmed' ? 'مؤكد' : 'قيد المعالجة'}
            </div>
            <button
              className="book-submit book-success-reveal"
              style={{ marginTop: 20, maxWidth: 240, animationDelay: '1.1s' }}
              onClick={() => navigate('/')}
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <>
            {/* Error banner */}
            {error && (
              <div className="book-error">
                <AlertCircle className="h-4 w-4" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error.message}</span>
              </div>
            )}

            {/* Passenger Form — Personal Info Card */}
            <div className="book-section-card book-stagger-2">
              <div className="book-section-header">
                <User className="h-4.5 w-4.5" />
                <span>بيانات المسافر</span>
              </div>

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

                {/* Passport Info Card (nested) */}
                <div className="book-passport-card book-stagger-3">
                  <div className="book-section-header">
                    <FileText className="h-4.5 w-4.5" />
                    <span>بيانات جواز السفر</span>
                  </div>

                  <div className="book-row">
                    <div className="book-field">
                      <label>رقم جواز السفر</label>
                      <input
                        type="text"
                        placeholder="مثال: N12345678"
                        value={form.passport_number}
                        onChange={e => updateField('passport_number', e.target.value)}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="book-field">
                      <label>تاريخ انتهاء الجواز</label>
                      <input
                        type="date"
                        value={form.passport_expiry}
                        onChange={e => updateField('passport_expiry', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="book-row">
                    <div className="book-field">
                      <label>الجنسية (رمز البلد)</label>
                      <select
                        value={form.nationality}
                        onChange={e => updateField('nationality', e.target.value)}
                      >
                        <option value="SY">سوريا (SY)</option>
                        <option value="AE">الإمارات (AE)</option>
                        <option value="SA">السعودية (SA)</option>
                        <option value="IQ">العراق (IQ)</option>
                        <option value="JO">الأردن (JO)</option>
                        <option value="LB">لبنان (LB)</option>
                        <option value="EG">مصر (EG)</option>
                        <option value="TR">تركيا (TR)</option>
                        <option value="DE">ألمانيا (DE)</option>
                        <option value="US">الولايات المتحدة (US)</option>
                        <option value="GB">بريطانيا (GB)</option>
                        <option value="FR">فرنسا (FR)</option>
                        <option value="SE">السويد (SE)</option>
                        <option value="NL">هولندا (NL)</option>
                      </select>
                    </div>
                    <div className="book-field">
                      <label>بلد الإصدار (رمز البلد)</label>
                      <select
                        value={form.issuance_country}
                        onChange={e => updateField('issuance_country', e.target.value)}
                      >
                        <option value="SY">سوريا (SY)</option>
                        <option value="AE">الإمارات (AE)</option>
                        <option value="SA">السعودية (SA)</option>
                        <option value="IQ">العراق (IQ)</option>
                        <option value="JO">الأردن (JO)</option>
                        <option value="LB">لبنان (LB)</option>
                        <option value="EG">مصر (EG)</option>
                        <option value="TR">تركيا (TR)</option>
                        <option value="DE">ألمانيا (DE)</option>
                        <option value="US">الولايات المتحدة (US)</option>
                        <option value="GB">بريطانيا (GB)</option>
                        <option value="FR">فرنسا (FR)</option>
                        <option value="SE">السويد (SE)</option>
                        <option value="NL">هولندا (NL)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Card (nested) */}
                <div className="book-address-card book-stagger-4">
                  <div className="book-section-header">
                    <MapPin className="h-4.5 w-4.5" />
                    <span>عنوان السكن</span>
                  </div>

                  <div className="book-field">
                    <label>العنوان</label>
                    <input
                      type="text"
                      placeholder="مثال: شارع بغداد، بناء 12"
                      value={form.address_line}
                      onChange={e => updateField('address_line', e.target.value)}
                    />
                  </div>

                  <div className="book-row">
                    <div className="book-field">
                      <label>المدينة</label>
                      <input
                        type="text"
                        placeholder="مثال: دمشق"
                        value={form.city}
                        onChange={e => updateField('city', e.target.value)}
                      />
                    </div>
                    <div className="book-field">
                      <label>الرمز البريدي</label>
                      <input
                        type="text"
                        placeholder="مثال: 10100"
                        value={form.postal_code}
                        onChange={e => updateField('postal_code', e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="book-submit book-stagger-5"
                  disabled={!isFormValid || isBooking || !flight.rawOffer}
                >
                  {isBooking ? (
                    <LoadingSpinner text="جاري إنشاء الحجز..." size="sm" />
                  ) : (
                    "تأكيد الحجز"
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
