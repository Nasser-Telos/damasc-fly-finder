import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Airline, Destination, Flight } from "@/types/flight";

export function useAirlines() {
  return useQuery({
    queryKey: ["airlines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("airlines")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Airline[];
    },
  });
}

export function useDestinations() {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true)
        .order("city");

      if (error) throw error;
      return data as Destination[];
    },
  });
}

export function useFlights(originCode?: string, destinationCode?: string) {
  return useQuery({
    queryKey: ["flights", originCode, destinationCode],
    queryFn: async () => {
      let query = supabase
        .from("flights")
        .select(`
          *,
          airline:airlines(*),
          origin:destinations!flights_origin_id_fkey(*),
          destination:destinations!flights_destination_id_fkey(*)
        `)
        .eq("is_active", true);

      const { data, error } = await query.order("price_usd", { ascending: true });

      if (error) throw error;
      
      // Filter by origin/destination if provided
      let flights = data as Flight[];
      
      if (originCode) {
        flights = flights.filter(f => f.origin?.airport_code === originCode);
      }
      
      if (destinationCode) {
        flights = flights.filter(f => f.destination?.airport_code === destinationCode);
      }
      
      return flights;
    },
    enabled: true,
  });
}

export function useDamascusFlights(type: 'from' | 'to', destinationCode?: string) {
  return useQuery({
    queryKey: ["damascus-flights", type, destinationCode],
    queryFn: async () => {
      const damascusCode = 'DAM';
      
      let query = supabase
        .from("flights")
        .select(`
          *,
          airline:airlines(*),
          origin:destinations!flights_origin_id_fkey(*),
          destination:destinations!flights_destination_id_fkey(*)
        `)
        .eq("is_active", true);

      const { data, error } = await query.order("price_usd", { ascending: true });

      if (error) throw error;
      
      let flights = data as Flight[];
      
      // Filter based on trip type
      if (type === 'from') {
        flights = flights.filter(f => f.origin?.airport_code === damascusCode);
        if (destinationCode) {
          flights = flights.filter(f => f.destination?.airport_code === destinationCode);
        }
      } else {
        flights = flights.filter(f => f.destination?.airport_code === damascusCode);
        if (destinationCode) {
          flights = flights.filter(f => f.origin?.airport_code === destinationCode);
        }
      }
      
      return flights;
    },
  });
}

export function useAleppoFlights(type: 'from' | 'to', destinationCode?: string) {
  return useQuery({
    queryKey: ["aleppo-flights", type, destinationCode],
    queryFn: async () => {
      const aleppoCode = 'ALP';
      
      let query = supabase
        .from("flights")
        .select(`
          *,
          airline:airlines(*),
          origin:destinations!flights_origin_id_fkey(*),
          destination:destinations!flights_destination_id_fkey(*)
        `)
        .eq("is_active", true);

      const { data, error } = await query.order("price_usd", { ascending: true });

      if (error) throw error;
      
      let flights = data as Flight[];
      
      // Filter based on trip type
      if (type === 'from') {
        flights = flights.filter(f => f.origin?.airport_code === aleppoCode);
        if (destinationCode) {
          flights = flights.filter(f => f.destination?.airport_code === destinationCode);
        }
      } else {
        flights = flights.filter(f => f.destination?.airport_code === aleppoCode);
        if (destinationCode) {
          flights = flights.filter(f => f.origin?.airport_code === destinationCode);
        }
      }
      
      return flights;
    },
  });
}

// Fetch min price and destination count for airports (for explore section)
export function useMinPricesForAirports(airportCodes: string[]) {
  return useQuery({
    queryKey: ["min-prices", airportCodes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select(`
          price_usd,
          origin:destinations!flights_origin_id_fkey(airport_code),
          destination:destinations!flights_destination_id_fkey(airport_code)
        `)
        .eq("is_active", true)
        .not("price_usd", "is", null);

      if (error) throw error;

      const result: Record<string, { minPrice: number; destinationCount: number }> = {};

      for (const code of airportCodes) {
        const relevantFlights = (data || []).filter(
          (f: any) => f.origin?.airport_code === code || f.destination?.airport_code === code
        );

        const prices = relevantFlights
          .map((f: any) => f.price_usd)
          .filter((p: any) => p != null) as number[];

        // Count unique destinations (the other end of the flight)
        const destCodes = new Set(
          relevantFlights.map((f: any) =>
            f.origin?.airport_code === code
              ? f.destination?.airport_code
              : f.origin?.airport_code
          ).filter(Boolean)
        );

        result[code] = {
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          destinationCount: destCodes.size,
        };
      }

      return result;
    },
    enabled: airportCodes.length > 0,
  });
}

// Min price for a specific route (e.g. DXB <-> DAM/ALP)
export function useMinPriceForRoute(userAirportCode: string | null) {
  return useQuery({
    queryKey: ["min-price-route", userAirportCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select(`
          price_usd,
          origin:destinations!flights_origin_id_fkey(airport_code),
          destination:destinations!flights_destination_id_fkey(airport_code)
        `)
        .eq("is_active", true)
        .not("price_usd", "is", null);

      if (error) throw error;

      const syrianCodes = ["DAM", "ALP"];
      const relevantFlights = (data || []).filter((f: any) => {
        const orig = f.origin?.airport_code;
        const dest = f.destination?.airport_code;
        return (
          (orig === userAirportCode && syrianCodes.includes(dest)) ||
          (dest === userAirportCode && syrianCodes.includes(orig))
        );
      });

      const prices = relevantFlights
        .map((f: any) => f.price_usd)
        .filter((p: any) => p != null && p > 0) as number[];

      return prices.length > 0 ? Math.min(...prices) : null;
    },
    enabled: !!userAirportCode && userAirportCode !== "DAM" && userAirportCode !== "ALP",
  });
}

// Combined flights for deals section (both to and from)
export function useAllFlightsForAirport(airportCode: string) {
  return useQuery({
    queryKey: ["all-flights-airport", airportCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select(`
          *,
          airline:airlines(*),
          origin:destinations!flights_origin_id_fkey(*),
          destination:destinations!flights_destination_id_fkey(*)
        `)
        .eq("is_active", true)
        .order("price_usd", { ascending: true });

      if (error) throw error;
      
      // Filter flights that are either from or to this airport
      const flights = (data as Flight[]).filter(
        f => f.origin?.airport_code === airportCode || f.destination?.airport_code === airportCode
      );
      
      return flights;
    },
    enabled: !!airportCode,
  });
}
