import { type Env, duffelFetch, jsonResponse, errorResponse, corsPreflightResponse } from './_duffel';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.DUFFEL_API_TOKEN;
  if (!token) {
    return errorResponse('Server misconfiguration: missing API token', 500);
  }

  let body: { offer_id?: string; departure_id?: string; arrival_id?: string; outbound_date?: string; currency?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { offer_id, departure_id, arrival_id, outbound_date, currency } = body;

  if (!offer_id) {
    return errorResponse('Missing offer_id', 400);
  }
  // Route params are optional — only needed for Google Flights URL
  if (departure_id && !/^[A-Z]{3}$/.test(departure_id)) {
    return errorResponse('Invalid departure_id: must be 3 uppercase letters', 400);
  }
  if (arrival_id && !/^[A-Z]{3}$/.test(arrival_id)) {
    return errorResponse('Invalid arrival_id: must be 3 uppercase letters', 400);
  }
  if (outbound_date && !/^\d{4}-\d{2}-\d{2}$/.test(outbound_date)) {
    return errorResponse('Invalid outbound_date: must be YYYY-MM-DD', 400);
  }

  try {
    const res = await duffelFetch(token, `/offers/${offer_id}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[booking-options] Duffel error ${res.status}: ${text}`);
      return errorResponse(`Failed to fetch offer details: ${res.status}`, 502);
    }

    const data = await res.json() as { data?: Record<string, unknown> };
    const offer = data?.data;

    const googleFlightsUrl = departure_id && arrival_id && outbound_date
      ? `https://www.google.com/travel/flights?q=Flights+from+${departure_id}+to+${arrival_id}+on+${outbound_date}&curr=${currency || 'USD'}`
      : undefined;

    return jsonResponse({
      offer,
      ...(googleFlightsUrl ? { google_flights_url: googleFlightsUrl } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(`Offer fetch failed: ${message}`, 500);
  }
};
