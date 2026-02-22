import { type Env, duffelFetch, jsonResponse, errorResponse, corsPreflightResponse } from './_duffel';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

function generateSampleDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const current = new Date(startDate);
  while (current <= endDate && dates.length < 10) {
    if (current >= today) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 3);
  }
  return dates;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.DUFFEL_API_TOKEN;
  if (!token) {
    return errorResponse('Server misconfiguration: missing API token', 500);
  }

  let body: {
    departure_id?: string;
    arrival_id?: string;
    outbound_date?: string;
    outbound_date_start?: string;
    outbound_date_end?: string;
    adults?: number;
    currency?: string;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { departure_id, arrival_id, outbound_date, outbound_date_start, outbound_date_end, adults = 1, currency } = body;

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

  const rangeStart = outbound_date_start || outbound_date;
  const rangeEnd = outbound_date_end || outbound_date;

  const sampleDates = generateSampleDates(rangeStart, rangeEnd);
  if (sampleDates.length === 0) {
    return jsonResponse({ calendar: [] });
  }

  console.log(`[calendar] Sampling ${sampleDates.length} dates for ${departure_id}->${arrival_id}`);

  try {
    const passengers = Array.from({ length: validatedAdults }, () => ({ type: 'adult' }));

    const results = await Promise.allSettled(
      sampleDates.map(async (date) => {
        const res = await duffelFetch(token, '/offer_requests?return_offers=true', {
          method: 'POST',
          body: {
            data: {
              slices: [
                {
                  origin: departure_id,
                  destination: arrival_id,
                  departure_date: date,
                },
              ],
              passengers,
              cabin_class: 'economy',
              currency: validatedCurrency,
              supplier_timeout: 8000,
            },
          },
        });

        if (!res.ok) return { date, price: undefined };

        const data = await res.json() as { data?: { offers?: { total_amount: string }[] } };
        const offers = data?.data?.offers ?? [];
        if (offers.length === 0) return { date, price: undefined };

        const prices = offers.map(o => parseFloat(o.total_amount)).filter(p => !isNaN(p));
        if (prices.length === 0) return { date, price: undefined };
        const cheapest = Math.min(...prices);
        return { date, price: cheapest };
      })
    );

    const calendar: { departure: string; price?: number; has_no_flights?: boolean; is_lowest_price?: boolean }[] = [];
    let lowestPrice = Infinity;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { date, price } = result.value;
        if (price !== undefined && !isNaN(price)) {
          calendar.push({ departure: date, price });
          if (price < lowestPrice) lowestPrice = price;
        } else {
          calendar.push({ departure: date, has_no_flights: true });
        }
      }
    }

    // Mark lowest price
    for (const entry of calendar) {
      if (entry.price === lowestPrice) {
        entry.is_lowest_price = true;
      }
    }

    console.log(`[calendar] Returning ${calendar.length} entries`);
    return jsonResponse({ calendar });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[calendar] Exception: ${message}`);
    return errorResponse(`Calendar search failed: ${message}`, 500);
  }
};
