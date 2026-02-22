import type { DuffelOfferResponse, DuffelOffer, DuffelSegmentLeg, DuffelLayover, LiveFlight, Destination } from '@/types/flight';
import { destinations } from '@/data/destinations';

const destinationsByCode = new Map<string, Destination>();
for (const d of destinations) {
  destinationsByCode.set(d.airport_code, d);
}

/** Convert ISO 8601 duration (PT2H26M, PT14H5M, PT45M, PT2H26M30S) to minutes */
function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
}

/** Extract HH:MM from ISO datetime (2026-03-15T14:30:00) */
function extractTime(isoDatetime: string): string {
  const tIndex = isoDatetime.indexOf('T');
  if (tIndex === -1) return isoDatetime;
  return isoDatetime.slice(tIndex + 1, tIndex + 6);
}

function mapOffer(offer: DuffelOffer, isBest: boolean, index: number): LiveFlight {
  const slice = offer.slices[0];
  const segments = slice.segments;
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  // Map segments to DuffelSegmentLeg[]
  const flightLegs: DuffelSegmentLeg[] = segments.map(seg => ({
    departure_airport: {
      name: seg.origin.name,
      id: seg.origin.iata_code,
      time: seg.departing_at,
    },
    arrival_airport: {
      name: seg.destination.name,
      id: seg.destination.iata_code,
      time: seg.arriving_at,
    },
    duration: parseIsoDuration(seg.duration),
    airplane: seg.aircraft?.name,
    airline: seg.operating_carrier.name,
    airline_logo: seg.operating_carrier.logo_symbol_url || seg.marketing_carrier.logo_symbol_url || '',
    travel_class: seg.passengers[0]?.cabin_class_marketing_name || seg.passengers[0]?.cabin_class || 'economy',
    flight_number: `${seg.marketing_carrier.iata_code} ${seg.marketing_carrier_flight_number}`,
  }));

  // Build layovers from gaps between consecutive segments
  const layovers: DuffelLayover[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const arriveAt = new Date(segments[i].arriving_at).getTime();
    const departAt = new Date(segments[i + 1].departing_at).getTime();
    const gapMinutes = Math.round((departAt - arriveAt) / 60000);
    if (gapMinutes > 0) {
      layovers.push({
        duration: gapMinutes,
        name: segments[i].destination.name,
        id: segments[i].destination.iata_code,
      });
    }
  }

  const totalDuration = parseIsoDuration(slice.duration);
  const price = parseFloat(offer.total_amount);
  const departureCode = firstSeg.origin.iata_code;
  const arrivalCode = lastSeg.destination.iata_code;

  return {
    id: `${isBest ? 'best' : 'offer'}-${index}-${offer.id.slice(0, 8)}`,
    flightLegs,
    layovers: layovers.length > 0 ? layovers : undefined,
    totalDuration,
    price,
    currency: offer.total_currency,
    stops: segments.length - 1,
    departureTime: extractTime(firstSeg.departing_at),
    arrivalTime: extractTime(lastSeg.arriving_at),
    departureAirport: { name: firstSeg.origin.name, id: departureCode },
    arrivalAirport: { name: lastSeg.destination.name, id: arrivalCode },
    airlineName: firstSeg.operating_carrier.name,
    airlineLogo: firstSeg.operating_carrier.logo_symbol_url || firstSeg.marketing_carrier.logo_symbol_url || '',
    airlineCode: firstSeg.marketing_carrier.iata_code,
    flightNumber: `${firstSeg.marketing_carrier.iata_code} ${firstSeg.marketing_carrier_flight_number}`,
    offerId: offer.id,
    isBest,
    fareBrandName: slice.fare_brand_name || undefined,
    conditions: offer.conditions,
    totalEmissionsKg: offer.total_emissions_kg ? parseFloat(offer.total_emissions_kg) : undefined,
    originDestination: destinationsByCode.get(departureCode),
    arrivalDestination: destinationsByCode.get(arrivalCode),
  };
}

export function mapDuffelOffers(response: DuffelOfferResponse): LiveFlight[] {
  const offers = response.data?.offers ?? [];
  if (offers.length === 0) return [];

  // Find cheapest price
  let cheapestPrice = Infinity;
  for (const offer of offers) {
    const p = parseFloat(offer.total_amount);
    if (p < cheapestPrice) cheapestPrice = p;
  }

  return offers.map((offer, i) => {
    const price = parseFloat(offer.total_amount);
    const isBest = price === cheapestPrice;
    return mapOffer(offer, isBest, i);
  });
}

export function buildGoogleFlightsUrl(
  departureId: string,
  arrivalId: string,
  date: string,
  currency: string = 'USD'
): string {
  return `https://www.google.com/travel/flights?q=Flights+from+${departureId}+to+${arrivalId}+on+${date}&curr=${currency}`;
}
