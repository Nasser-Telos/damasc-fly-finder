import { type Env, duffelFetch, jsonResponse, errorResponse, corsPreflightResponse } from './_duffel';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.DUFFEL_API_TOKEN;
  if (!token) {
    return errorResponse('Server misconfiguration: missing API token', 500);
  }

  let body: { departure_id?: string; arrival_id?: string; outbound_date?: string; adults?: number; currency?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { departure_id, arrival_id, outbound_date, adults = 1, currency } = body;

  const ALLOWED_CURRENCIES = ['USD', 'AED', 'SAR'];
  const validatedAdults = Math.max(1, Math.min(9, Math.floor(Number(adults) || 1)));
  const validatedCurrency = currency && ALLOWED_CURRENCIES.includes(currency) ? currency : 'USD';

  if (!departure_id || !/^[A-Z]{3}$/.test(departure_id)) {
    return errorResponse('Invalid departure_id: must be 3 uppercase letters', 400);
  }
  if (!arrival_id || !/^[A-Z]{3}$/.test(arrival_id)) {
    return errorResponse('Invalid arrival_id: must be 3 uppercase letters', 400);
  }
  if (!outbound_date || !/^\d{4}-\d{2}-\d{2}$/.test(outbound_date)) {
    return errorResponse('Invalid outbound_date: must be YYYY-MM-DD', 400);
  }

  try {
    const passengers = Array.from({ length: validatedAdults }, () => ({ type: 'adult' }));

    const res = await duffelFetch(token, '/offer_requests?return_offers=true', {
      method: 'POST',
      body: {
        data: {
          slices: [
            {
              origin: departure_id,
              destination: arrival_id,
              departure_date: outbound_date,
            },
          ],
          passengers,
          cabin_class: 'economy',
          currency: validatedCurrency,
          supplier_timeout: 25000,
        },
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[flights] Duffel error ${res.status}: ${text}`);
      return errorResponse(`Flight search failed: ${res.status}`, 502);
    }

    const data = await res.json();
    return jsonResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(`Search failed: ${message}`, 500);
  }
};
