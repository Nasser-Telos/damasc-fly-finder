import { useMutation } from '@tanstack/react-query';
import { createBooking } from '@/lib/api';
import type { CreateOrderRequest } from '@/types/flight';

interface BookingResult {
  order_id: string;
  booking_reference: string;
  status: string;
}

export function useBooking() {
  const { mutate, isPending, data, error, reset } = useMutation<
    BookingResult,
    Error,
    CreateOrderRequest
  >({
    mutationFn: (params) => createBooking(params),
  });

  return {
    book: mutate,
    isBooking: isPending,
    bookingResult: data ?? null,
    error: error as Error | null,
    reset,
  };
}
