import type { FlightSearchRequest, AmadeusSearchResponse, BookingOptionsRequest, FlightCalendarRequest, CreateOrderRequest } from '@/types/flight';

export class FlightSearchError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'FlightSearchError';
    this.statusCode = statusCode;
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let message = fallbackMessage;
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse error
    }
    throw new FlightSearchError(message, res.status);
  }

  return await res.json() as T;
}

export function searchFlights(
  params: FlightSearchRequest,
  signal?: AbortSignal
): Promise<AmadeusSearchResponse> {
  return postJson('/api/flights', params, 'فشل البحث عن الرحلات', signal);
}

export function searchFlightCalendar(
  params: FlightCalendarRequest,
  signal?: AbortSignal
): Promise<{ calendar: { departure: string; price?: number; has_no_flights?: boolean; is_lowest_price?: boolean }[] }> {
  return postJson('/api/calendar', params, 'فشل تحميل أسعار التقويم', signal);
}

export function fetchBookingOptions(
  params: BookingOptionsRequest,
  signal?: AbortSignal
): Promise<{ offer: Record<string, unknown>; google_flights_url: string }> {
  return postJson('/api/booking-options', params, 'فشل تحميل تفاصيل العرض', signal);
}

export function createBooking(
  params: CreateOrderRequest
): Promise<{ order_id: string; booking_reference: string; status: string }> {
  return postJson('/api/book', params, 'فشل إنشاء الحجز');
}
