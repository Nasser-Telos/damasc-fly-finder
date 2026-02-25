import { type Env, getAmadeusToken, amadeusFetch, checkCredentials, parseJsonBody, jsonResponse, errorResponse, corsPreflightResponse } from './_amadeus';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const credErr = checkCredentials(env);
  if (credErr) return credErr;

  const parsed = await parseJsonBody<{ offer?: Record<string, unknown>; departure_id?: string; arrival_id?: string; outbound_date?: string; currency?: string }>(request);
  if (parsed instanceof Response) return parsed;
  const { offer, departure_id, arrival_id, outbound_date, currency } = parsed;

  if (!offer) {
    return errorResponse('بيانات العرض مفقودة', 400);
  }
  if (departure_id && !/^[A-Z]{3}$/.test(departure_id)) {
    return errorResponse('رمز مطار المغادرة غير صالح', 400);
  }
  if (arrival_id && !/^[A-Z]{3}$/.test(arrival_id)) {
    return errorResponse('رمز مطار الوصول غير صالح', 400);
  }
  if (outbound_date && !/^\d{4}-\d{2}-\d{2}$/.test(outbound_date)) {
    return errorResponse('تاريخ المغادرة غير صالح', 400);
  }

  try {
    const token = await getAmadeusToken(env);

    const res = await amadeusFetch(env, token, '/v1/shopping/flight-offers/pricing', {
      method: 'POST',
      body: {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [offer],
        },
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[booking-options] Amadeus error ${res.status}: ${text}`);
      return errorResponse('فشل تسعير العرض', 502);
    }

    const data = await res.json() as { data?: { flightOffers?: Record<string, unknown>[] } };
    const pricedOffer = data?.data?.flightOffers?.[0];
    if (!pricedOffer) {
      return errorResponse('لم يتم العثور على عرض مسعّر', 502);
    }

    const googleFlightsUrl = departure_id && arrival_id && outbound_date
      ? `https://www.google.com/travel/flights?q=Flights+from+${departure_id}+to+${arrival_id}+on+${outbound_date}&curr=${currency || 'USD'}`
      : undefined;

    return jsonResponse({
      offer: pricedOffer,
      ...(googleFlightsUrl ? { google_flights_url: googleFlightsUrl } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    console.error(`[booking-options] Exception: ${message}`);
    return errorResponse('فشل تسعير العرض', 500);
  }
};
