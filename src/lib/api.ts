import type { FlightSearchRequest, DuffelOfferResponse, BookingOptionsRequest, FlightCalendarRequest, CreateOrderRequest } from '@/types/flight';

export class FlightSearchError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'FlightSearchError';
    this.statusCode = statusCode;
  }
}

export async function searchFlights(
  params: FlightSearchRequest,
  signal?: AbortSignal
): Promise<DuffelOfferResponse> {
  const res = await fetch('/api/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    let message = 'فشل البحث عن الرحلات';
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse error
    }
    throw new FlightSearchError(message, res.status);
  }

  return await res.json() as DuffelOfferResponse;
}

export async function searchFlightCalendar(
  params: FlightCalendarRequest,
  signal?: AbortSignal
): Promise<{ calendar: { departure: string; price?: number; has_no_flights?: boolean; is_lowest_price?: boolean }[] }> {
  const res = await fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    let message = 'فشل تحميل أسعار التقويم';
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse error
    }
    throw new FlightSearchError(message, res.status);
  }

  return await res.json();
}

export async function fetchBookingOptions(
  params: BookingOptionsRequest,
  signal?: AbortSignal
): Promise<{ offer: Record<string, unknown>; google_flights_url: string }> {
  const res = await fetch('/api/booking-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    let message = 'فشل تحميل تفاصيل العرض';
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse error
    }
    throw new FlightSearchError(message, res.status);
  }

  return await res.json();
}

export async function fetchOfferById(
  offerId: string,
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  const res = await fetch('/api/booking-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offer_id: offerId }),
    signal,
  });

  if (!res.ok) {
    let message = 'فشل تحميل تفاصيل العرض';
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse error
    }
    throw new FlightSearchError(message, res.status);
  }

  const data = await res.json();
  return data.offer;
}

export async function createBooking(
  params: CreateOrderRequest
): Promise<{ order_id: string; booking_reference: string; status: string }> {
  const res = await fetch('/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let message = 'فشل إنشاء الحجز';
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse error
    }
    throw new FlightSearchError(message, res.status);
  }

  return await res.json();
}
