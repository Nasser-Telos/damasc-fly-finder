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
