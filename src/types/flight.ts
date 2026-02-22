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

// Duffel segment leg — maps to UI display (same shape as old ApifyFlightLeg)
export interface DuffelSegmentLeg {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport: { name: string; id: string; time: string };
  duration: number;
  airplane?: string;
  airline: string;
  airline_logo: string;
  travel_class: string;
  flight_number: string;
}

export interface DuffelLayover {
  duration: number;
  name: string;
  id: string;
}

// Raw Duffel API response shape (for the mapper)
export interface DuffelOfferResponse {
  data: {
    id: string;
    offers: DuffelOffer[];
    slices: DuffelRequestSlice[];
  };
}

export interface DuffelRequestSlice {
  origin: { iata_code: string; name: string };
  destination: { iata_code: string; name: string };
}

export interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  tax_amount: string | null;
  tax_currency: string | null;
  base_amount: string | null;
  base_currency: string | null;
  owner: {
    iata_code: string;
    name: string;
    logo_symbol_url: string | null;
    logo_lockup_url: string | null;
  };
  slices: DuffelSlice[];
  passengers: { id: string; type: string }[];
  conditions: {
    refund_before_departure: { allowed: boolean; penalty_amount?: string; penalty_currency?: string } | null;
    change_before_departure: { allowed: boolean; penalty_amount?: string; penalty_currency?: string } | null;
  };
  total_emissions_kg?: string;
  expires_at: string;
}

export interface DuffelSlice {
  id: string;
  duration: string; // ISO 8601 e.g. "PT2H26M"
  origin: { iata_code: string; name: string; city_name: string };
  destination: { iata_code: string; name: string; city_name: string };
  segments: DuffelSegment[];
  fare_brand_name: string | null;
}

export interface DuffelSegment {
  id: string;
  origin: { iata_code: string; name: string };
  destination: { iata_code: string; name: string };
  departing_at: string; // ISO datetime
  arriving_at: string;
  duration: string; // ISO 8601
  operating_carrier: {
    iata_code: string;
    name: string;
    logo_symbol_url: string | null;
    logo_lockup_url: string | null;
  };
  marketing_carrier: {
    iata_code: string;
    name: string;
    logo_symbol_url: string | null;
    logo_lockup_url: string | null;
  };
  operating_carrier_flight_number: string;
  marketing_carrier_flight_number: string;
  aircraft: { name: string } | null;
  passengers: {
    cabin_class: string;
    cabin_class_marketing_name: string;
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
}

export interface CreateOrderRequest {
  offer_id: string;
  passengers: BookingPassenger[];
}

export interface BookingOptionsRequest {
  offer_id: string;
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
  flightLegs: DuffelSegmentLeg[];
  layovers?: DuffelLayover[];
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
  conditions?: DuffelOffer['conditions'];
  totalEmissionsKg?: number;
  originDestination?: Destination;
  arrivalDestination?: Destination;
}
