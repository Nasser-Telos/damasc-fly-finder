interface Env {
  SEARCHAPI_API_KEY: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.SEARCHAPI_API_KEY;
  if (!apiKey) {
    return errorResponse('Server misconfiguration: missing API key', 500);
  }

  let body: { departure_id?: string; arrival_id?: string; outbound_date?: string; adults?: number };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { departure_id, arrival_id, outbound_date, adults = 1 } = body;

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
    const url = new URL('https://www.searchapi.io/api/v1/search');
    url.searchParams.set('engine', 'google_flights');
    url.searchParams.set('departure_id', departure_id);
    url.searchParams.set('arrival_id', arrival_id);
    url.searchParams.set('outbound_date', outbound_date);
    url.searchParams.set('type', '2');
    url.searchParams.set('currency', 'USD');
    url.searchParams.set('travel_class', 'economy');
    url.searchParams.set('adults', String(adults));
    url.searchParams.set('api_key', apiKey);

    const res = await fetch(url.toString());

    if (!res.ok) {
      const text = await res.text();
      return errorResponse(`Search API error: ${text}`, 502);
    }

    const data = await res.json();
    return jsonResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(`Search failed: ${message}`, 500);
  }
};
