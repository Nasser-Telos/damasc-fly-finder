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

export interface Flight {
  id: string;
  airline_id: string;
  origin_id: string;
  destination_id: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  price_usd: number | null;
  days_of_week: number[];
  stops: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  airline?: Airline;
  origin?: Destination;
  destination?: Destination;
}

export interface FlightSearchParams {
  tripType: 'from_damascus' | 'to_damascus';
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
