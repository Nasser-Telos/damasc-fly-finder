import type { AmadeusSearchResponse, AmadeusFlightOffer, FlightLeg, FlightLayover, LiveFlight, Destination } from '@/types/flight';
import { destinations } from '@/data/destinations';

const destinationsByCode = new Map<string, Destination>();
for (const d of destinations) {
  destinationsByCode.set(d.airport_code, d);
}

/** Convert ISO 8601 duration (PT2H26M, P1DT2H30M, PT45M, PT2H26M30S) to minutes */
export function parseIsoDuration(iso: string): number {
  const match = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);
  return days * 24 * 60 + hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
}

/** Extract HH:MM from ISO datetime (2026-03-15T14:30:00) */
export function extractTime(isoDatetime: string): string {
  const tIndex = isoDatetime.indexOf('T');
  if (tIndex === -1) return isoDatetime;
  return isoDatetime.slice(tIndex + 1, tIndex + 6);
}

function getAirportName(iataCode: string): string {
  const dest = destinationsByCode.get(iataCode);
  if (dest) return dest.airport_name_ar || dest.airport_name || dest.city_ar || iataCode;
  return iataCode;
}

function getAirlineLogo(iataCode: string): string {
  return `https://pics.avs.io/60/60/${iataCode}.png`;
}

function mapOffer(
  offer: AmadeusFlightOffer,
  dictionaries: AmadeusSearchResponse['dictionaries'],
  isBest: boolean,
  index: number
): LiveFlight {
  const itinerary = offer.itineraries[0];
  const segments = itinerary.segments;
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const carriers = dictionaries?.carriers ?? {};
  const aircraft = dictionaries?.aircraft ?? {};

  const fareDetails = offer.travelerPricings?.[0]?.fareDetailsBySegment ?? [];

  const flightLegs: FlightLeg[] = segments.map((seg, segIdx) => {
    const segFare = fareDetails.find(f => f.segmentId === seg.id) || fareDetails[segIdx];
    const carrierCode = seg.operating?.carrierCode || seg.carrierCode;
    const carrierName = carriers[carrierCode] || carrierCode;

    return {
      departure_airport: {
        name: getAirportName(seg.departure.iataCode),
        id: seg.departure.iataCode,
        time: seg.departure.at,
      },
      arrival_airport: {
        name: getAirportName(seg.arrival.iataCode),
        id: seg.arrival.iataCode,
        time: seg.arrival.at,
      },
      duration: parseIsoDuration(seg.duration),
      airplane: aircraft[seg.aircraft.code] || seg.aircraft.code,
      airline: carrierName,
      airline_logo: getAirlineLogo(carrierCode),
      travel_class: segFare?.cabin || 'ECONOMY',
      flight_number: `${seg.carrierCode} ${seg.number}`,
    };
  });

  const layovers: FlightLayover[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const arriveAt = new Date(segments[i].arrival.at).getTime();
    const departAt = new Date(segments[i + 1].departure.at).getTime();
    const gapMinutes = Math.round((departAt - arriveAt) / 60000);
    if (gapMinutes > 0) {
      layovers.push({
        duration: gapMinutes,
        name: getAirportName(segments[i].arrival.iataCode),
        id: segments[i].arrival.iataCode,
      });
    }
  }

  const totalDuration = parseIsoDuration(itinerary.duration);
  const price = parseFloat(offer.price.grandTotal);
  const departureCode = firstSeg.departure.iataCode;
  const arrivalCode = lastSeg.arrival.iataCode;
  const mainCarrierCode = firstSeg.operating?.carrierCode || firstSeg.carrierCode;

  const brandedFare = fareDetails[0]?.brandedFare;

  return {
    id: `${isBest ? 'best' : 'offer'}-${index}-${offer.id.slice(0, 8)}`,
    flightLegs,
    layovers: layovers.length > 0 ? layovers : undefined,
    totalDuration,
    price,
    currency: offer.price.currency,
    stops: segments.length - 1,
    departureTime: extractTime(firstSeg.departure.at),
    arrivalTime: extractTime(lastSeg.arrival.at),
    departureAirport: { name: getAirportName(departureCode), id: departureCode },
    arrivalAirport: { name: getAirportName(arrivalCode), id: arrivalCode },
    airlineName: carriers[mainCarrierCode] || mainCarrierCode,
    airlineLogo: getAirlineLogo(mainCarrierCode),
    airlineCode: firstSeg.carrierCode,
    flightNumber: `${firstSeg.carrierCode} ${firstSeg.number}`,
    offerId: offer.id,
    isBest,
    fareBrandName: brandedFare || undefined,
    originDestination: destinationsByCode.get(departureCode),
    arrivalDestination: destinationsByCode.get(arrivalCode),
    rawOffer: offer,
  };
}

export function mapAmadeusOffers(response: AmadeusSearchResponse): LiveFlight[] {
  const offers = response.data ?? [];
  if (offers.length === 0) return [];

  let cheapestPrice = Infinity;
  for (const offer of offers) {
    const p = parseFloat(offer.price?.grandTotal);
    if (!isNaN(p) && p < cheapestPrice) cheapestPrice = p;
  }

  const results: LiveFlight[] = [];
  for (let i = 0; i < offers.length; i++) {
    try {
      const price = parseFloat(offers[i].price.grandTotal);
      const isBest = price === cheapestPrice;
      results.push(mapOffer(offers[i], response.dictionaries, isBest, i));
    } catch (err) {
      console.warn(`[flightMapper] Skipping malformed offer at index ${i}:`, err);
    }
  }
  return results;
}

export function buildGoogleFlightsUrl(
  departureId: string,
  arrivalId: string,
  date: string,
  currency: string = 'USD'
): string {
  return `https://www.google.com/travel/flights?q=Flights+from+${departureId}+to+${arrivalId}+on+${date}&curr=${currency}`;
}
