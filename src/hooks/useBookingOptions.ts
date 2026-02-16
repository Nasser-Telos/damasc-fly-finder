import { useMutation } from '@tanstack/react-query';
import { fetchBookingOptions } from '@/lib/api';
import type { BookingOption, BookingOptionsRequest } from '@/types/flight';
import { buildGoogleFlightsUrl } from '@/lib/flightMapper';

function buildBookingUrl(option: BookingOption): string {
  const { url, post_data } = option.booking_request;
  if (post_data) {
    return `${url}?${post_data}`;
  }
  return url;
}

export function useBookingOptions() {
  const { mutate, isPending, reset } = useMutation<
    BookingOption[],
    Error,
    BookingOptionsRequest
  >({
    mutationFn: (params) => fetchBookingOptions(params),
    onSuccess: (options, params) => {
      if (options.length > 0) {
        const cheapest = options.reduce((min, opt) =>
          opt.price < min.price ? opt : min, options[0]);
        window.open(buildBookingUrl(cheapest), '_blank');
      } else {
        window.open(
          buildGoogleFlightsUrl(params.departure_id, params.arrival_id, params.outbound_date, params.currency),
          '_blank'
        );
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
