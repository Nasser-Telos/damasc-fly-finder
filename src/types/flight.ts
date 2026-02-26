export interface Airline {
  id: string;
  name: string;
  name_ar: string;
  code: string;
  logo_url: string | null;
  website_url: string | null;
  country: string | null;
  description: string | null;
  description_ar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  city: string;
  city_ar: string;
  country: string;
  country_ar: string;
  airport_code: string;
  airport_name: string | null;
  airport_name_ar: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FlightSearchParams {
  tripType: 'from_damascus' | 'to_damascus' | 'from_aleppo' | 'to_aleppo';
  destination?: string;
  date?: Date;
  passengers: number;
}

export interface FlightFilters {
  airlines: string[];
  maxPrice: number | null;
  directOnly: boolean;
  sortBy: 'price' | 'duration' | 'departure';
}

// Flight leg — maps to UI display
export interface FlightLeg {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport: { name: string; id: string; time: string };
  duration: number;
  airplane?: string;
  airline: string;
  airline_logo: string;
  travel_class: string;
  flight_number: string;
}

export interface FlightLayover {
  duration: number;
  name: string;
  id: string;
}

// Amadeus API response types
export interface AmadeusSearchResponse {
  data: AmadeusFlightOffer[];
  dictionaries?: {
    carriers?: Record<string, string>;
    aircraft?: Record<string, string>;
    currencies?: Record<string, string>;
    locations?: Record<string, { cityCode: string; countryCode: string }>;
  };
}

export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: { fareType: string[]; includedCheckedBagsOnly: boolean };
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

export interface AmadeusItinerary {
  duration: string; // ISO 8601 e.g. "PT2H26M"
  segments: AmadeusSegment[];
}

export interface AmadeusSegment {
  departure: { iataCode: string; terminal?: string; at: string };
  arrival: { iataCode: string; terminal?: string; at: string };
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  operating?: { carrierCode: string };
  duration: string; // ISO 8601
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  grandTotal: string;
  fees?: { amount: string; type: string }[];
}

export interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: { currency: string; total: string; base: string };
  fareDetailsBySegment: {
    segmentId: string;
    cabin: string;
    fareBasis: string;
    brandedFare?: string;
    class: string;
    includedCheckedBags?: { weight?: number; weightUnit?: string; quantity?: number };
  }[];
}

// Booking types
export interface BookingPassenger {
  given_name: string;
  family_name: string;
  born_on: string; // YYYY-MM-DD
  email: string;
  phone_number: string;
  gender: 'm' | 'f';
  title: 'mr' | 'ms' | 'mrs';
  passport_number: string;
  passport_expiry: string; // YYYY-MM-DD
  nationality: string; // ISO 3166-1 alpha-2 (e.g. "SY")
  issuance_country: string; // ISO 3166-1 alpha-2 (e.g. "SY")
  address_line?: string;
  city?: string;
  postal_code?: string;
}

export interface CreateOrderRequest {
  offer: AmadeusFlightOffer;
  passengers: BookingPassenger[];
}

export interface BookingOptionsRequest {
  offer: AmadeusFlightOffer;
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  currency?: string;
}

// Calendar API types
export interface FlightCalendarRequest {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  outbound_date_start?: string;
  outbound_date_end?: string;
  adults?: number;
  currency?: string;
}

export interface CalendarEntry {
  departure: string;       // "YYYY-MM-DD"
  price?: number;
  has_no_flights?: boolean;
  is_lowest_price?: boolean;
}

// Client request to our CF function
export interface FlightSearchRequest {
  departure_id: string;
  arrival_id: string;
  outbound_date: string; // YYYY-MM-DD
  adults?: number;
  currency?: string;
}

// Normalized flight for UI display
export interface LiveFlight {
  id: string;
  flightLegs: FlightLeg[];
  layovers?: FlightLayover[];
  totalDuration: number;
  price: number;
  currency: string;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport: { name: string; id: string };
  arrivalAirport: { name: string; id: string };
  airlineName: string;
  airlineLogo: string;
  airlineCode: string;
  flightNumber: string;
  offerId: string;
  isBest: boolean;
  fareBrandName?: string;
  originDestination?: Destination;
  arrivalDestination?: Destination;
  rawOffer?: AmadeusFlightOffer;
}
