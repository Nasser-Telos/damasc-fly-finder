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

// Apify response types

export interface ApifyFlightLeg {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport: { name: string; id: string; time: string };
  duration: number;
  airplane?: string;
  airline: string;
  airline_logo: string;
  travel_class: string;
  flight_number: string;
  legroom?: string;
  extensions?: string[];
  often_delayed_by_over_30_min?: boolean;
}

export interface ApifyLayover {
  duration: number;
  name: string;
  id: string;
  overnight?: boolean;
}

export interface ApifyFlightOption {
  flights: ApifyFlightLeg[];
  layovers?: ApifyLayover[];
  total_duration: number;
  price: number;
  type: string;
  airline_logo: string;
  booking_token: string;
  carbon_emissions?: {
    this_flight?: number;
    typical_for_this_route?: number;
    difference_percent?: number;
  };
}

export interface ApifySearchResult {
  search_parameters: {
    departure_id: string;
    arrival_id: string;
    outbound_date: string;
    adults: number;
    children: number;
    infants: number;
    currency: string;
  };
  search_metadata: {
    total_flights_found: number;
    status: string;
  };
  best_flights: ApifyFlightOption[];
  other_flights: ApifyFlightOption[];
  price_insights?: {
    lowest_price: number;
    price_level: string;
  };
}

// Client request to our CF function
export interface FlightSearchRequest {
  departure_id: string;
  arrival_id: string;
  outbound_date: string; // YYYY-MM-DD
  adults?: number;
}

// Normalized flight for UI display
export interface LiveFlight {
  id: string;
  flightLegs: ApifyFlightLeg[];
  layovers?: ApifyLayover[];
  totalDuration: number;
  price: number;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport: { name: string; id: string };
  arrivalAirport: { name: string; id: string };
  airlineName: string;
  airlineLogo: string;
  airlineCode: string;
  flightNumber: string;
  bookingToken: string;
  isBest: boolean;
  originDestination?: Destination;
  arrivalDestination?: Destination;
}
