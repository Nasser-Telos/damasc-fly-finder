import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { searchFlightCalendar } from '@/lib/api';
import type { CalendarEntry } from '@/types/flight';

interface UseFlightCalendarParams {
  departure_id: string;
  arrival_id: string;
  outbound_date_start: string; // YYYY-MM-DD (first day of month)
  outbound_date_end: string;   // YYYY-MM-DD (last day of month)
}

interface UseFlightCalendarResult {
  calendarData: CalendarEntry[];
  calendarMap: Map<string, CalendarEntry>;
  isLoading: boolean;
  cheapestDate: string | null;
  cheapestPrice: number | null;
}

export function useFlightCalendar(params: UseFlightCalendarParams | null): UseFlightCalendarResult {
  const { data, isLoading } = useQuery({
    queryKey: ['flight-calendar', params?.departure_id, params?.arrival_id, params?.outbound_date_start, params?.outbound_date_end],
    queryFn: async ({ signal }) => {
      if (!params) throw new Error('No params');
      return searchFlightCalendar({
        departure_id: params.departure_id,
        arrival_id: params.arrival_id,
        outbound_date: params.outbound_date_start,
        outbound_date_start: params.outbound_date_start,
        outbound_date_end: params.outbound_date_end,
      }, signal);
    },
    enabled: !!params,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const calendarData = data?.calendar ?? [];

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const entry of calendarData) {
      map.set(entry.departure, entry);
    }
    return map;
  }, [calendarData]);

  const { cheapestDate, cheapestPrice } = useMemo(() => {
    let minPrice: number | null = null;
    let minDate: string | null = null;
    for (const entry of calendarData) {
      if (entry.price != null && !entry.has_no_flights) {
        if (minPrice === null || entry.price < minPrice) {
          minPrice = entry.price;
          minDate = entry.departure;
        }
      }
    }
    return { cheapestDate: minDate, cheapestPrice: minPrice };
  }, [calendarData]);

  return { calendarData, calendarMap, isLoading, cheapestDate, cheapestPrice };
}
