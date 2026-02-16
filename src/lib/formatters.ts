export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}س ${mins}د`;
}

import type { CurrencyCode } from './currency';

export function formatPrice(price: number | null, currency: CurrencyCode = 'USD'): string {
  if (!price) return "اتصل للسعر";
  const formatted = price.toLocaleString();
  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'AED') return `${formatted} د.إ`;
  if (currency === 'SAR') return `${formatted} ر.س`;
  return `$${formatted}`;
}
