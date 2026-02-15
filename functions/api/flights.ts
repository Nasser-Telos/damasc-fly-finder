interface Env {
  APIFY_API_TOKEN: string;
}

const ACTOR_ID = '1dYHRKkEBHBPd0JM7';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 60000;

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
  const token = env.APIFY_API_TOKEN;
  if (!token) {
    return errorResponse('Server misconfiguration: missing API token', 500);
  }

  let body: { departure_id?: string; arrival_id?: string; outbound_date?: string; adults?: number };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { departure_id, arrival_id, outbound_date, adults = 1 } = body;

  // Validate inputs
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
    // Step 1: Start an Apify actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departure_id,
          arrival_id,
          outbound_date,
          adults,
          currency: 'USD',
          travel_class: 'ECONOMY',
          type: 'one-way',
        }),
      }
    );

    if (!startRes.ok) {
      const text = await startRes.text();
      return errorResponse(`Apify start failed: ${text}`, 502);
    }

    const startData = await startRes.json() as { data: { id: string; defaultDatasetId: string; status: string } };
    const runId = startData.data.id;
    const datasetId = startData.data.defaultDatasetId;

    // Step 2: Poll for completion
    const deadline = Date.now() + MAX_POLL_MS;
    let status = startData.data.status;

    while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED' && status !== 'TIMED-OUT') {
      if (Date.now() > deadline) {
        return errorResponse('Search timed out. Please try again.', 504);
      }
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const pollRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
      );
      if (!pollRes.ok) {
        return errorResponse('Failed to check search status', 502);
      }
      const pollData = await pollRes.json() as { data: { status: string } };
      status = pollData.data.status;
    }

    if (status !== 'SUCCEEDED') {
      return errorResponse(`Search ended with status: ${status}`, 502);
    }

    // Step 3: Fetch dataset items
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );
    if (!dataRes.ok) {
      return errorResponse('Failed to fetch search results', 502);
    }

    const items = await dataRes.json();
    return jsonResponse(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(`Search failed: ${message}`, 500);
  }
};
