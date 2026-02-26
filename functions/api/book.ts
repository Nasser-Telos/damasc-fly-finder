import { type Env, getAmadeusToken, amadeusFetch, extractCountryCode, extractPhoneNumber, checkCredentials, parseJsonBody, jsonResponse, errorResponse, corsPreflightResponse } from './_amadeus';
import type { BookingPassenger } from './types';

export const onRequestOptions: PagesFunction = async () => corsPreflightResponse();

function validatePassenger(p: BookingPassenger, index: number): string | null {
  const n = index + 1;
  if (!p.given_name?.trim()) return `المسافر ${n}: الاسم الأول مطلوب`;
  if (!p.family_name?.trim()) return `المسافر ${n}: اسم العائلة مطلوب`;
  if (!p.born_on || !/^\d{4}-\d{2}-\d{2}$/.test(p.born_on)) return `المسافر ${n}: تاريخ الميلاد غير صالح`;
  if (!p.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) return `المسافر ${n}: البريد الإلكتروني غير صالح`;
  if (!p.phone_number?.trim() || !/^\+?[\d\s\-()]{7,}$/.test(p.phone_number.trim())) return `المسافر ${n}: رقم الهاتف غير صالح`;
  if (!['m', 'f'].includes(p.gender)) return `المسافر ${n}: الجنس غير صالح`;
  if (!['mr', 'ms', 'mrs'].includes(p.title)) return `المسافر ${n}: اللقب غير صالح`;
  if (!p.passport_number?.trim()) return `المسافر ${n}: رقم جواز السفر مطلوب`;
  if (!p.passport_expiry || !/^\d{4}-\d{2}-\d{2}$/.test(p.passport_expiry)) return `المسافر ${n}: تاريخ انتهاء الجواز غير صالح`;
  if (!p.nationality?.trim() || !/^[A-Z]{2}$/.test(p.nationality.trim())) return `المسافر ${n}: الجنسية غير صالحة`;
  if (!p.issuance_country?.trim() || !/^[A-Z]{2}$/.test(p.issuance_country.trim())) return `المسافر ${n}: بلد الإصدار غير صالح`;
  return null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const credErr = checkCredentials(env);
  if (credErr) return credErr;

  const parsed = await parseJsonBody<{ offer?: Record<string, unknown>; passengers?: BookingPassenger[] }>(request);
  if (parsed instanceof Response) return parsed;
  const { offer, passengers } = parsed;

  if (!offer) {
    return errorResponse('بيانات العرض مفقودة', 400);
  }
  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return errorResponse('بيانات المسافرين مفقودة', 400);
  }

  for (let i = 0; i < passengers.length; i++) {
    const err = validatePassenger(passengers[i], i);
    if (err) return errorResponse(err, 400);
  }

  try {
    const token = await getAmadeusToken(env);

    // Step 1: Reprice the offer
    const pricingRes = await amadeusFetch(env, token, '/v1/shopping/flight-offers/pricing', {
      method: 'POST',
      body: {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [offer],
        },
      },
    });

    if (!pricingRes.ok) {
      const text = await pricingRes.text();
      console.error(`[book] Pricing error ${pricingRes.status}: ${text}`);
      let userMessage = 'انتهت صلاحية العرض أو لم يعد متاحاً';
      try {
        const errData = JSON.parse(text);
        const detail = errData?.errors?.[0]?.detail || errData?.errors?.[0]?.title;
        if (detail) userMessage = `انتهت صلاحية العرض: ${detail}`;
      } catch { /* JSON parse may fail, ignore */ }
      return errorResponse(userMessage, 404);
    }

    const pricingData = await pricingRes.json() as { data?: { flightOffers?: Record<string, unknown>[] } };
    const pricedOffer = pricingData?.data?.flightOffers?.[0];
    if (!pricedOffer) {
      return errorResponse('فشل إعادة تسعير العرض', 502);
    }

    // Extract traveler IDs from the priced offer to match Amadeus expectations
    const travelerPricings = (pricedOffer as { travelerPricings?: { travelerId: string }[] }).travelerPricings || [];
    const travelerIds = travelerPricings.map(tp => tp.travelerId);

    // Step 2: Create order
    const travelers = passengers.map((p, i) => ({
      id: travelerIds[i] || String(i + 1),
      dateOfBirth: p.born_on,
      gender: p.gender === 'm' ? 'MALE' : 'FEMALE',
      name: {
        firstName: p.given_name.trim().toUpperCase(),
        lastName: p.family_name.trim().toUpperCase(),
      },
      contact: {
        emailAddress: p.email.trim(),
        phones: [
          {
            deviceType: 'MOBILE',
            countryCallingCode: extractCountryCode(p.phone_number),
            number: extractPhoneNumber(p.phone_number),
          },
        ],
      },
      documents: [
        {
          documentType: 'PASSPORT',
          number: p.passport_number.trim().toUpperCase(),
          expiryDate: p.passport_expiry,
          issuanceCountry: p.issuance_country.trim().toUpperCase(),
          nationality: p.nationality.trim().toUpperCase(),
          holder: true,
        },
      ],
    }));

    // Top-level contacts (required by Amadeus — address is mandatory)
    const firstPassenger = passengers[0];
    const contacts = [
      {
        addresseeName: {
          firstName: firstPassenger.given_name.trim().toUpperCase(),
          lastName: firstPassenger.family_name.trim().toUpperCase(),
        },
        purpose: 'STANDARD',
        phones: [
          {
            deviceType: 'MOBILE',
            countryCallingCode: extractCountryCode(firstPassenger.phone_number),
            number: extractPhoneNumber(firstPassenger.phone_number),
          },
        ],
        emailAddress: firstPassenger.email.trim(),
        address: {
          lines: [firstPassenger.address_line?.trim() || 'N/A'],
          postalCode: firstPassenger.postal_code?.trim() || '00000',
          cityName: firstPassenger.city?.trim() || 'Damascus',
          countryCode: firstPassenger.nationality.trim().toUpperCase(),
        },
      },
    ];

    // Ticketing agreement — delay cancellation by 6 days (per Amadeus spec example)
    const ticketingAgreement = {
      option: 'DELAY_TO_CANCEL',
      delay: '6D',
    };

    const orderRes = await amadeusFetch(env, token, '/v1/booking/flight-orders', {
      method: 'POST',
      body: {
        data: {
          type: 'flight-order',
          flightOffers: [pricedOffer],
          travelers,
          contacts,
          ticketingAgreement,
        },
      },
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      console.error(`[book] Order error ${orderRes.status}: ${text}`);
      let userMessage = 'فشل إنشاء الحجز';
      try {
        const errData = JSON.parse(text);
        const detail = errData?.errors?.[0]?.detail || errData?.errors?.[0]?.title;
        if (detail) userMessage = `فشل إنشاء الحجز: ${detail}`;
      } catch { /* JSON parse may fail, ignore */ }
      return errorResponse(userMessage, 502);
    }

    const orderData = await orderRes.json() as {
      data?: {
        id?: string;
        associatedRecords?: { reference: string }[];
        type?: string;
      };
    };
    const order = orderData?.data;

    if (!order?.id) {
      console.error('[book] Order response missing id:', JSON.stringify(orderData));
      return errorResponse('استجابة الحجز غير مكتملة', 502);
    }

    const bookingRef = order.associatedRecords?.[0]?.reference || order.id;

    return jsonResponse({
      order_id: order.id,
      booking_reference: bookingRef,
      status: order.type === 'flight-order' ? 'confirmed' : 'pending',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    console.error(`[book] Exception: ${message}`);
    return errorResponse('فشل إنشاء الحجز', 500);
  }
};
