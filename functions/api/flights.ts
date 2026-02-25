import { type Env, getAmadeusToken, amadeusFetch, checkCredentials, parseJsonBody, jsonResponse, errorResponse, corsPreflightResponse } from './_amadeus';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

const ALLOWED_CURRENCIES = ['USD', 'AED', 'SAR'];

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const credErr = checkCredentials(env);
  if (credErr) return credErr;

  const parsed = await parseJsonBody<{ departure_id?: string; arrival_id?: string; outbound_date?: string; adults?: number; currency?: string }>(request);
  if (parsed instanceof Response) return parsed;

  const { departure_id, arrival_id, outbound_date, adults = 1, currency } = parsed;

  const validatedAdults = Math.max(1, Math.min(9, Math.floor(Number(adults) || 1)));
  const validatedCurrency = currency && ALLOWED_CURRENCIES.includes(currency) ? currency : 'USD';

  if (!departure_id || !/^[A-Z]{3}$/.test(departure_id)) {
    return errorResponse('رمز مطار المغادرة غير صالح', 400);
  }
  if (!arrival_id || !/^[A-Z]{3}$/.test(arrival_id)) {
    return errorResponse('رمز مطار الوصول غير صالح', 400);
  }
  if (!outbound_date || !/^\d{4}-\d{2}-\d{2}$/.test(outbound_date)) {
    return errorResponse('تاريخ المغادرة غير صالح', 400);
  }

  try {
    const token = await getAmadeusToken(env);

    const travelers = Array.from({ length: validatedAdults }, (_, i) => ({
      id: String(i + 1),
      travelerType: 'ADULT',
    }));

    const res = await amadeusFetch(env, token, '/v2/shopping/flight-offers', {
      method: 'POST',
      body: {
        currencyCode: validatedCurrency,
        sources: ['GDS'],
        searchCriteria: { maxFlightOffers: 50 },
        originDestinations: [
          {
            id: '1',
            originLocationCode: departure_id,
            destinationLocationCode: arrival_id,
            departureDateTimeRange: { date: outbound_date },
          },
        ],
        travelers,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[flights] Amadeus error ${res.status}: ${text}`);
      return errorResponse('فشل البحث عن الرحلات', 502);
    }

    const data = await res.json();
    return jsonResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    console.error(`[flights] Exception: ${message}`);
    return errorResponse('فشل البحث عن الرحلات', 500);
  }
};
