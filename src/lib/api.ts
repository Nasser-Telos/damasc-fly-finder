import type { FlightSearchRequest, ApifySearchResult } from '@/types/flight';

export class FlightSearchError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'FlightSearchError';
    this.statusCode = statusCode;
  }
}

const EMPTY_RESULT: ApifySearchResult = {
  search_parameters: {
    departure_id: '',
    arrival_id: '',
    outbound_date: '',
    adults: 1,
    children: 0,
    infants: 0,
    currency: 'USD',
  },
  search_metadata: { total_flights_found: 0, status: 'complete' },
  best_flights: [],
  other_flights: [],
};

export async function searchFlights(
  params: FlightSearchRequest,
  signal?: AbortSignal
): Promise<ApifySearchResult> {
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

  const data = await res.json();

  // Apify returns array of dataset items — take first item
  if (Array.isArray(data) && data.length > 0) {
    return data[0] as ApifySearchResult;
  }

  return EMPTY_RESULT;
}
