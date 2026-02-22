import { useMutation } from '@tanstack/react-query';
import { fetchBookingOptions } from '@/lib/api';
import type { BookingOptionsRequest } from '@/types/flight';
import { buildGoogleFlightsUrl } from '@/lib/flightMapper';

export function useBookingOptions() {
  const { mutate, isPending, reset } = useMutation<
    { offer: Record<string, unknown>; google_flights_url: string },
    Error,
    BookingOptionsRequest
  >({
    mutationFn: (params) => fetchBookingOptions(params),
    onSuccess: (data) => {
      // Open Google Flights as fallback (in the future, navigate to booking page)
      if (data.google_flights_url) {
        window.open(data.google_flights_url, '_blank');
      }
    },
    onError: (_error, params) => {
      window.open(
        buildGoogleFlightsUrl(params.departure_id, params.arrival_id, params.outbound_date, params.currency),
        '_blank'
      );
    },
  });

  return {
    isLoading: isPending,
    fetchOptions: (params: BookingOptionsRequest) => mutate(params),
    reset,
  };
}
