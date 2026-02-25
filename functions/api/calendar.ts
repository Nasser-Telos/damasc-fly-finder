import { type Env, getAmadeusToken, amadeusFetch, checkCredentials, parseJsonBody, jsonResponse, errorResponse, corsPreflightResponse } from './_amadeus';

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

const ALLOWED_CURRENCIES = ['USD', 'AED', 'SAR'];

async function fetchDatePrice(
  env: Env,
  token: string,
  date: string,
  departure_id: string,
  arrival_id: string,
  travelers: { id: string; travelerType: string }[],
  currency: string,
): Promise<{ date: string; price?: number; error?: boolean }> {
  const res = await amadeusFetch(env, token, '/v2/shopping/flight-offers', {
    method: 'POST',
    body: {
      currencyCode: currency,
      sources: ['GDS'],
      searchCriteria: { maxFlightOffers: 5 },
      originDestinations: [
        {
          id: '1',
          originLocationCode: departure_id,
          destinationLocationCode: arrival_id,
          departureDateTimeRange: { date },
        },
      ],
      travelers,
    },
  });

  if (!res.ok) {
    console.error(`[calendar] Amadeus error for ${date}: ${res.status}`);
    return { date, error: true };
  }

  const data = await res.json() as { data?: { price: { grandTotal: string } }[] };
  const offers = data?.data ?? [];
  if (offers.length === 0) return { date, price: undefined };

  const prices = offers.map(o => parseFloat(o.price.grandTotal)).filter(p => !isNaN(p));
  if (prices.length === 0) return { date, price: undefined };
  const cheapest = Math.min(...prices);
  return { date, price: cheapest };
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      try {
        results[idx] = { status: 'fulfilled', value: await tasks[idx]() };
      } catch (reason) {
        results[idx] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
  await Promise.all(workers);
  return results;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const credErr = checkCredentials(env);
  if (credErr) return credErr;

  const parsed = await parseJsonBody<{
    departure_id?: string;
    arrival_id?: string;
    outbound_date?: string;
    outbound_date_start?: string;
    outbound_date_end?: string;
    adults?: number;
    currency?: string;
  }>(request);
  if (parsed instanceof Response) return parsed;

  const { departure_id, arrival_id, outbound_date, outbound_date_start, outbound_date_end, adults = 1, currency } = parsed;

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

  const rangeStart = outbound_date_start || outbound_date;
  const rangeEnd = outbound_date_end || outbound_date;

  const sampleDates = generateSampleDates(rangeStart, rangeEnd);
  if (sampleDates.length === 0) {
    return jsonResponse({ calendar: [] });
  }

  console.log(`[calendar] Sampling ${sampleDates.length} dates for ${departure_id}->${arrival_id}`);

  try {
    const token = await getAmadeusToken(env);

    const travelers = Array.from({ length: validatedAdults }, (_, i) => ({
      id: String(i + 1),
      travelerType: 'ADULT',
    }));

    const tasks = sampleDates.map((date) => () =>
      fetchDatePrice(env, token, date, departure_id, arrival_id, travelers, validatedCurrency)
    );

    const results = await runWithConcurrency(tasks, 3);

    const calendar: { departure: string; price?: number; has_no_flights?: boolean; is_lowest_price?: boolean }[] = [];
    let lowestPrice = Infinity;
    let errorCount = 0;

    for (const result of results) {
      if (result.status === 'rejected') {
        errorCount++;
        console.error(`[calendar] Request rejected:`, result.reason);
        continue;
      }
      const { date, price, error } = result.value;
      if (error) {
        errorCount++;
        continue;
      }
      if (price !== undefined && !isNaN(price)) {
        calendar.push({ departure: date, price });
        if (price < lowestPrice) lowestPrice = price;
      } else {
        calendar.push({ departure: date, has_no_flights: true });
      }
    }

    if (errorCount === sampleDates.length) {
      return errorResponse('فشل تحميل بيانات التقويم. يرجى المحاولة لاحقاً', 502);
    }

    for (const entry of calendar) {
      if (entry.price === lowestPrice) {
        entry.is_lowest_price = true;
      }
    }

    console.log(`[calendar] Returning ${calendar.length} entries (${errorCount} errors)`);
    return jsonResponse({ calendar });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    console.error(`[calendar] Exception: ${message}`);
    return errorResponse('فشل البحث في التقويم', 500);
  }
};
