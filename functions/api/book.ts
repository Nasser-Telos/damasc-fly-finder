import { type Env, duffelFetch, jsonResponse, errorResponse, corsPreflightResponse } from './_duffel';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

interface BookingPassenger {
  given_name: string;
  family_name: string;
  born_on: string;
  email: string;
  phone_number: string;
  gender: 'm' | 'f';
  title: 'mr' | 'ms' | 'mrs';
}

function validatePassenger(p: BookingPassenger, index: number): string | null {
  if (!p.given_name?.trim()) return `Passenger ${index + 1}: missing given_name`;
  if (!p.family_name?.trim()) return `Passenger ${index + 1}: missing family_name`;
  if (!p.born_on || !/^\d{4}-\d{2}-\d{2}$/.test(p.born_on)) return `Passenger ${index + 1}: invalid born_on`;
  if (!p.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) return `Passenger ${index + 1}: invalid email`;
  if (!p.phone_number?.trim() || !/^\+?[\d\s\-()]{7,}$/.test(p.phone_number.trim())) return `Passenger ${index + 1}: invalid phone_number`;
  if (!['m', 'f'].includes(p.gender)) return `Passenger ${index + 1}: invalid gender`;
  if (!['mr', 'ms', 'mrs'].includes(p.title)) return `Passenger ${index + 1}: invalid title`;
  return null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.DUFFEL_API_TOKEN;
  if (!token) {
    return errorResponse('Server misconfiguration: missing API token', 500);
  }

  let body: { offer_id?: string; passengers?: BookingPassenger[] };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { offer_id, passengers } = body;

  if (!offer_id) {
    return errorResponse('Missing offer_id', 400);
  }
  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return errorResponse('Missing or empty passengers array', 400);
  }

  // Validate all passengers
  for (let i = 0; i < passengers.length; i++) {
    const err = validatePassenger(passengers[i], i);
    if (err) return errorResponse(err, 400);
  }

  try {
    // First fetch the offer to get passenger IDs
    const offerRes = await duffelFetch(token, `/offers/${offer_id}`);
    if (!offerRes.ok) {
      const text = await offerRes.text();
      console.error(`[book] Failed to fetch offer: ${text}`);
      return errorResponse('Offer not found or expired', 404);
    }

    const offerData = await offerRes.json() as { data?: { passengers?: { id: string; type: string }[] } };
    const offerPassengers = offerData?.data?.passengers ?? [];

    if (offerPassengers.length !== passengers.length) {
      return errorResponse(
        `Passenger count mismatch: offer expects ${offerPassengers.length}, got ${passengers.length}`,
        400
      );
    }

    // Map passengers with their Duffel IDs
    const duffelPassengers = passengers.map((p, i) => ({
      id: offerPassengers[i].id,
      type: offerPassengers[i].type,
      given_name: p.given_name.trim(),
      family_name: p.family_name.trim(),
      born_on: p.born_on,
      email: p.email.trim(),
      phone_number: p.phone_number.trim(),
      gender: p.gender,
      title: p.title,
    }));

    const res = await duffelFetch(token, '/orders', {
      method: 'POST',
      body: {
        data: {
          type: 'pay_later',
          selected_offers: [offer_id],
          passengers: duffelPassengers,
        },
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[book] Duffel order error ${res.status}: ${text}`);

      // Try to parse Duffel error for a friendly message
      try {
        const errData = JSON.parse(text);
        const duffelMsg = errData?.errors?.[0]?.message || 'Booking failed';
        return errorResponse(duffelMsg, 502);
      } catch {
        return errorResponse(`Booking failed: ${res.status}`, 502);
      }
    }

    const orderData = await res.json() as { data?: { id?: string; booking_reference?: string; status?: string } };
    const order = orderData?.data;

    return jsonResponse({
      order_id: order?.id,
      booking_reference: order?.booking_reference,
      status: order?.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(`Booking failed: ${message}`, 500);
  }
};
