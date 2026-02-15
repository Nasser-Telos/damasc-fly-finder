import { useQuery } from "@tanstack/react-query";
import { airlines } from "@/data/airlines";
import { destinations } from "@/data/destinations";
import type { Airline, Destination } from "@/types/flight";

export function useAirlines() {
  return useQuery({
    queryKey: ["airlines"],
    queryFn: () => airlines as Airline[],
    staleTime: Infinity,
  });
}

export function useDestinations() {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: () => destinations as Destination[],
    staleTime: Infinity,
  });
}
