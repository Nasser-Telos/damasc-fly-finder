export interface Env {
  DUFFEL_API_TOKEN: string;
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

export function corsPreflightResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function duffelFetch(
  token: string,
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<Response> {
  const { method = 'GET', body } = options;
  return fetch(`https://api.duffel.com/air${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Duffel-Version': 'v2',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
