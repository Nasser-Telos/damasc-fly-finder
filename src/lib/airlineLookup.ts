import { airlines } from '@/data/airlines';
import type { Airline } from '@/types/flight';

const airlineByCode = new Map<string, Airline>();
for (const a of airlines) {
  airlineByCode.set(a.code, a);
}

export function getAirlineArabicName(code: string): string | null {
  return airlineByCode.get(code)?.name_ar ?? null;
}

export function getAirlineWebsite(code: string): string | null {
  return airlineByCode.get(code)?.website_url ?? null;
}
