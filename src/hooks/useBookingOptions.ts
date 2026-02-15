import { useMutation } from '@tanstack/react-query';
import { fetchBookingOptions } from '@/lib/api';
import type { BookingOption, BookingOptionsRequest } from '@/types/flight';

export function useBookingOptions() {
  const { data, mutate, isPending, error, reset } = useMutation<
    BookingOption[],
    Error,
    BookingOptionsRequest
  >({
    mutationFn: (params) => fetchBookingOptions(params),
  });

  return {
    bookingOptions: data ?? [],
    isLoading: isPending,
    error: error as Error | null,
    fetchOptions: (params: BookingOptionsRequest) => mutate(params),
    reset,
  };
}
