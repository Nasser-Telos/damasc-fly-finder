import type { ApifySearchResult, ApifyFlightOption, LiveFlight, Destination } from '@/types/flight';
import { destinations } from '@/data/destinations';

const destinationsByCode = new Map<string, Destination>();
for (const d of destinations) {
  destinationsByCode.set(d.airport_code, d);
}

function extractTime(dateTimeStr: string): string {
  // "2026-03-15 14:30" -> "14:30"  or  "2026-03-15T14:30" -> "14:30"
  const parts = dateTimeStr.split(/[\sT]/);
  if (parts.length >= 2) {
    return parts[1].slice(0, 5);
  }
  return dateTimeStr;
}

function extractAirlineCode(flightNumber: string): string {
  // "EK 123" -> "EK", "EK123" -> "EK"
  const match = flightNumber.match(/^([A-Z]{2,3})\s?\d/);
  return match ? match[1] : flightNumber.slice(0, 2);
}

function mapOption(option: ApifyFlightOption, isBest: boolean, index: number): LiveFlight {
  const firstLeg = option.flights[0];
  const lastLeg = option.flights[option.flights.length - 1];

  const departureAirportId = firstLeg.departure_airport.id;
  const arrivalAirportId = lastLeg.arrival_airport.id;

  return {
    id: `${isBest ? 'best' : 'other'}-${index}-${option.booking_token.slice(0, 8)}`,
    flightLegs: option.flights,
    layovers: option.layovers,
    totalDuration: option.total_duration,
    price: option.price,
    stops: option.flights.length - 1,
    departureTime: extractTime(firstLeg.departure_airport.time),
    arrivalTime: extractTime(lastLeg.arrival_airport.time),
    departureAirport: { name: firstLeg.departure_airport.name, id: departureAirportId },
    arrivalAirport: { name: lastLeg.arrival_airport.name, id: arrivalAirportId },
    airlineName: firstLeg.airline,
    airlineLogo: option.airline_logo,
    airlineCode: extractAirlineCode(firstLeg.flight_number),
    flightNumber: firstLeg.flight_number,
    bookingToken: option.booking_token,
    isBest,
    originDestination: destinationsByCode.get(departureAirportId),
    arrivalDestination: destinationsByCode.get(arrivalAirportId),
  };
}

export function mapSearchResults(result: ApifySearchResult): LiveFlight[] {
  const flights: LiveFlight[] = [];

  if (result.best_flights) {
    result.best_flights.forEach((opt, i) => {
      flights.push(mapOption(opt, true, i));
    });
  }

  if (result.other_flights) {
    result.other_flights.forEach((opt, i) => {
      flights.push(mapOption(opt, false, i));
    });
  }

  return flights;
}

export function buildGoogleFlightsUrl(
  departureId: string,
  arrivalId: string,
  date: string,
  currency: string = 'USD'
): string {
  // date = "YYYY-MM-DD"
  return `https://www.google.com/travel/flights?q=Flights+from+${departureId}+to+${arrivalId}+on+${date}&curr=${currency}`;
}
