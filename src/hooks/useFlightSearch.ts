import { useQuery } from '@tanstack/react-query';
import { searchFlights } from '@/lib/api';
import { mapSearchResults } from '@/lib/flightMapper';
import type { FlightSearchRequest, LiveFlight, ApifySearchResult } from '@/types/flight';

interface UseFlightSearchResult {
  flights: LiveFlight[];
  isSearching: boolean;
  error: Error | null;
  search: () => void;
  totalFound: number;
  priceInsights: ApifySearchResult['price_insights'] | null;
}

export function useFlightSearch(params: FlightSearchRequest | null): UseFlightSearchResult {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['flight-search', params?.departure_id, params?.arrival_id, params?.outbound_date, params?.adults, params?.currency],
    queryFn: async ({ signal }) => {
      if (!params) throw new Error('No search params');
      const result = await searchFlights(params, signal);
      return {
        flights: mapSearchResults(result),
        totalFound: result.search_metadata?.total_flights_found ?? 0,
        priceInsights: result.price_insights ?? null,
      };
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    flights: data?.flights ?? [],
    isSearching: isLoading || isFetching,
    error: error as Error | null,
    search: () => { if (params) refetch(); },
    totalFound: data?.totalFound ?? 0,
    priceInsights: data?.priceInsights ?? null,
  };
}
