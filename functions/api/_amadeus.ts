export interface Env {
  AMADEUS_CLIENT_ID: string;
  AMADEUS_CLIENT_SECRET: string;
  AMADEUS_API_URL?: string;
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getBaseUrl(env: Env): string {
  return env.AMADEUS_API_URL || 'https://test.api.amadeus.com';
}

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

export function checkCredentials(env: Env): Response | null {
  if (!env.AMADEUS_CLIENT_ID || !env.AMADEUS_CLIENT_SECRET) {
    return errorResponse('خطأ في إعدادات الخادم', 500);
  }
  return null;
}

export async function parseJsonBody<T>(request: Request): Promise<T | Response> {
  try {
    return await request.json() as T;
  } catch {
    return errorResponse('طلب غير صالح', 400);
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAmadeusToken(env: Env): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const baseUrl = getBaseUrl(env);
  const res = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(env.AMADEUS_CLIENT_ID)}&client_secret=${encodeURIComponent(env.AMADEUS_CLIENT_SECRET)}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus auth failed (${res.status}): ${text}`);
  }

  const data = await res.json() as Record<string, unknown>;
  if (typeof data.access_token !== 'string' || !data.access_token) {
    throw new Error('Amadeus auth response missing access_token');
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 1799;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return cachedToken.token;
}

export async function amadeusFetch(
  env: Env,
  token: string,
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<Response> {
  const { method = 'GET', body } = options;
  const baseUrl = getBaseUrl(env);
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const KNOWN_COUNTRY_CODES = ['1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98', '212', '213', '216', '218', '220', '221', '234', '249', '250', '251', '252', '253', '254', '255', '256', '260', '261', '263', '351', '352', '353', '354', '355', '358', '359', '370', '371', '372', '373', '374', '375', '380', '381', '385', '386', '387', '389', '420', '421', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'];

export function extractCountryCode(phone: string): string {
  if (!phone.startsWith('+')) return '963';
  const digits = phone.slice(1).replace(/\D/g, '');
  // Try 3-digit, 2-digit, then 1-digit country codes
  for (const len of [3, 2, 1]) {
    const candidate = digits.slice(0, len);
    if (KNOWN_COUNTRY_CODES.includes(candidate)) return candidate;
  }
  return '963';
}

export function extractPhoneNumber(phone: string): string {
  if (!phone.startsWith('+')) return phone.replace(/[\s\-()]/g, '');
  const digits = phone.slice(1).replace(/\D/g, '');
  const cc = extractCountryCode(phone);
  return digits.slice(cc.length);
}
