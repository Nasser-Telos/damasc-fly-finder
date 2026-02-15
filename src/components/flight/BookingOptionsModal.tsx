import { ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { buildGoogleFlightsUrl } from "@/lib/flightMapper";
import type { BookingOption } from "@/types/flight";

interface BookingOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingOptions: BookingOption[];
  isLoading: boolean;
  error: Error | null;
  flightLabel: string;
  departureId: string;
  arrivalId: string;
  date: string;
}

function buildBookingUrl(option: BookingOption): string {
  const { url, post_data } = option.booking_request;
  if (post_data) {
    return `${url}?${post_data}`;
  }
  return url;
}

export function BookingOptionsModal({
  open,
  onOpenChange,
  bookingOptions,
  isLoading,
  error,
  flightLabel,
  departureId,
  arrivalId,
  date,
}: BookingOptionsModalProps) {
  const fallbackUrl = buildGoogleFlightsUrl(departureId, arrivalId, date);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent dir="rtl" className="booking-drawer-content">
        <DrawerHeader className="booking-drawer-header">
          <DrawerTitle className="booking-drawer-title">خيارات الحجز</DrawerTitle>
          <DrawerDescription className="booking-drawer-desc">
            {flightLabel}
          </DrawerDescription>
        </DrawerHeader>

        <div className="booking-drawer-body">
          {isLoading ? (
            <div className="booking-loading">
              <Loader2 className="h-6 w-6 booking-spinner" />
              <span>جاري تحميل خيارات الحجز...</span>
            </div>
          ) : error ? (
            <div className="booking-error">
              <AlertTriangle className="h-5 w-5" />
              <span>تعذر تحميل خيارات الحجز</span>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="booking-fallback-link"
              >
                البحث في Google Flights
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : bookingOptions.length === 0 ? (
            <div className="booking-error">
              <span>لا توجد خيارات حجز متاحة</span>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="booking-fallback-link"
              >
                البحث في Google Flights
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="booking-options-list">
              {bookingOptions.map((option, i) => (
                <a
                  key={i}
                  href={buildBookingUrl(option)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="booking-option-card"
                >
                  <div className="booking-option-top">
                    <span className="booking-option-agent">{option.book_with}</span>
                    {option.airline && (
                      <span className="booking-option-direct-badge">حجز مباشر</span>
                    )}
                  </div>
                  {option.option_title && (
                    <span className="booking-option-fare">{option.option_title}</span>
                  )}
                  {option.extensions && option.extensions.length > 0 && (
                    <div className="booking-option-extras">
                      {option.extensions.map((ext, j) => (
                        <span key={j} className="booking-option-ext">{ext}</span>
                      ))}
                    </div>
                  )}
                  <div className="booking-option-bottom">
                    <span className="booking-option-price">${option.price}</span>
                    <span className="booking-option-go">
                      احجز
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
