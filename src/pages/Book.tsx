import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Plane, Clock, User, FileText, AlertCircle, MapPin, Mail, Phone, Building2, Hash } from "lucide-react";
import { useBooking } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPrice, formatDuration } from "@/lib/formatters";
import { getAirlineArabicName } from "@/lib/airlineLookup";
import type { LiveFlight } from "@/types/flight";
import type { CurrencyCode } from "@/lib/currency";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CountrySelect } from "@/components/ui/country-select";
import { GenderToggle } from "@/components/booking/gender-toggle";
import { bookingPassengerSchema, type BookingFormData } from "@/lib/booking-schema";
import { TITLE_OPTIONS } from "@/lib/booking-constants";
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

  // Form with Zod validation
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingPassengerSchema),
    mode: 'onBlur',
    defaultValues: {
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
    },
  });

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Reset booking error when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (error) reset();
    });
    return () => subscription.unsubscribe();
  }, [form, error, reset]);

  const onSubmit = (data: BookingFormData) => {
    if (!flight?.rawOffer) return;
    book({
      offer: flight.rawOffer,
      passengers: [data],
    });
  };

  // Current step for progress indicator
  const currentStep = bookingResult ? 3 : 2;

  // Date constraints
  const today = new Date();
  const minBirthDate = new Date(1930, 0, 1);

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

              <Form {...form}>
                <form className="book-form" onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Name row */}
                  <div className="book-row">
                    <FormField
                      control={form.control}
                      name="given_name"
                      render={({ field, fieldState }) => (
                        <FormItem className="book-field">
                          <FormLabel>الاسم الأول (بالإنجليزية)</FormLabel>
                          <FormControl>
                            <div className={`book-input-wrap ${fieldState.error ? 'book-input-error' : ''} ${field.value && !fieldState.error ? 'book-input-success' : ''}`}>
                              <User className="book-input-icon" />
                              <input
                                {...field}
                                className="book-input-with-icon"
                                type="text"
                                placeholder="مثال: Ahmed"
                              />
                            </div>
                          </FormControl>
                          <span className="book-field-hint">الاسم كما هو في جواز السفر</span>
                          <FormMessage className="book-error-msg" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="family_name"
                      render={({ field, fieldState }) => (
                        <FormItem className="book-field">
                          <FormLabel>اسم العائلة (بالإنجليزية)</FormLabel>
                          <FormControl>
                            <div className={`book-input-wrap ${fieldState.error ? 'book-input-error' : ''} ${field.value && !fieldState.error ? 'book-input-success' : ''}`}>
                              <User className="book-input-icon" />
                              <input
                                {...field}
                                className="book-input-with-icon"
                                type="text"
                                placeholder="مثال: Al-Hassan"
                              />
                            </div>
                          </FormControl>
                          <span className="book-field-hint">الاسم كما هو في جواز السفر</span>
                          <FormMessage className="book-error-msg" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Birth date + Gender row */}
                  <div className="book-row">
                    <FormField
                      control={form.control}
                      name="born_on"
                      render={({ field, fieldState }) => (
                        <FormItem className="book-field">
                          <FormLabel>تاريخ الميلاد</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              maxDate={today}
                              minDate={minBirthDate}
                              placeholder="اختر تاريخ الميلاد"
                              error={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage className="book-error-msg" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem className="book-field">
                          <FormLabel>الجنس</FormLabel>
                          <FormControl>
                            <GenderToggle
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage className="book-error-msg" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="book-field">
                        <FormLabel>اللقب</FormLabel>
                        <Select
                          dir="rtl"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="book-select-trigger">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TITLE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="book-error-msg" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem className="book-field">
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className={`book-input-wrap book-input-ltr ${fieldState.error ? 'book-input-error' : ''} ${field.value && !fieldState.error ? 'book-input-success' : ''}`}>
                            <Mail className="book-input-icon" />
                            <input
                              {...field}
                              className="book-input-with-icon"
                              type="email"
                              placeholder="example@email.com"
                              dir="ltr"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="book-error-msg" />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field, fieldState }) => (
                      <FormItem className="book-field">
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <div className={`book-input-wrap book-input-ltr ${fieldState.error ? 'book-input-error' : ''} ${field.value && !fieldState.error ? 'book-input-success' : ''}`}>
                            <Phone className="book-input-icon" />
                            <input
                              {...field}
                              className="book-input-with-icon"
                              type="tel"
                              placeholder="+963 xxx xxx xxx"
                              dir="ltr"
                            />
                          </div>
                        </FormControl>
                        <span className="book-field-hint">يرجى إدخال رقم الهاتف مع رمز البلد</span>
                        <FormMessage className="book-error-msg" />
                      </FormItem>
                    )}
                  />

                  {/* Passport Info Card */}
                  <div className="book-passport-card book-stagger-3">
                    <div className="book-section-header">
                      <FileText className="h-4.5 w-4.5" />
                      <span>بيانات جواز السفر</span>
                    </div>

                    <div className="book-row">
                      <FormField
                        control={form.control}
                        name="passport_number"
                        render={({ field, fieldState }) => (
                          <FormItem className="book-field">
                            <FormLabel>رقم جواز السفر</FormLabel>
                            <FormControl>
                              <div className={`book-input-wrap book-input-ltr ${fieldState.error ? 'book-input-error' : ''} ${field.value && !fieldState.error ? 'book-input-success' : ''}`}>
                                <FileText className="book-input-icon" />
                                <input
                                  {...field}
                                  className="book-input-with-icon"
                                  type="text"
                                  placeholder="مثال: N12345678"
                                  dir="ltr"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="book-error-msg" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="passport_expiry"
                        render={({ field, fieldState }) => (
                          <FormItem className="book-field">
                            <FormLabel>تاريخ انتهاء الجواز</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                minDate={today}
                                maxDate={new Date(2040, 11, 31)}
                                placeholder="اختر تاريخ الانتهاء"
                                error={!!fieldState.error}
                              />
                            </FormControl>
                            <FormMessage className="book-error-msg" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="book-row">
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field, fieldState }) => (
                          <FormItem className="book-field">
                            <FormLabel>الجنسية</FormLabel>
                            <FormControl>
                              <CountrySelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="اختر الجنسية"
                                error={!!fieldState.error}
                              />
                            </FormControl>
                            <FormMessage className="book-error-msg" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="issuance_country"
                        render={({ field, fieldState }) => (
                          <FormItem className="book-field">
                            <FormLabel>بلد الإصدار</FormLabel>
                            <FormControl>
                              <CountrySelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="اختر بلد الإصدار"
                                error={!!fieldState.error}
                              />
                            </FormControl>
                            <FormMessage className="book-error-msg" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="book-address-card book-stagger-4">
                    <div className="book-section-header">
                      <MapPin className="h-4.5 w-4.5" />
                      <span>عنوان السكن</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="address_line"
                      render={({ field }) => (
                        <FormItem className="book-field">
                          <FormLabel>العنوان</FormLabel>
                          <FormControl>
                            <div className="book-input-wrap">
                              <MapPin className="book-input-icon" />
                              <input
                                {...field}
                                className="book-input-with-icon"
                                type="text"
                                placeholder="مثال: شارع بغداد، بناء 12"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="book-row">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="book-field">
                            <FormLabel>المدينة</FormLabel>
                            <FormControl>
                              <div className="book-input-wrap">
                                <Building2 className="book-input-icon" />
                                <input
                                  {...field}
                                  className="book-input-with-icon"
                                  type="text"
                                  placeholder="مثال: دمشق"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem className="book-field">
                            <FormLabel>الرمز البريدي</FormLabel>
                            <FormControl>
                              <div className="book-input-wrap book-input-ltr">
                                <Hash className="book-input-icon" />
                                <input
                                  {...field}
                                  className="book-input-with-icon"
                                  type="text"
                                  placeholder="مثال: 10100"
                                  dir="ltr"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="book-submit book-stagger-5"
                    disabled={!form.formState.isValid || isBooking || !flight.rawOffer}
                  >
                    {isBooking ? (
                      <LoadingSpinner text="جاري إنشاء الحجز..." size="sm" />
                    ) : (
                      "تأكيد الحجز"
                    )}
                  </button>
                </form>
              </Form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
