export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}س ${mins}د`;
}

import type { CurrencyCode } from './currency';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  AED: 'د.إ',
  SAR: 'ر.س',
  GBP: '£',
  EUR: '€',
  TRY: '₺',
  EGP: 'ج.م',
  JOD: 'د.أ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
};

export function formatPrice(price: number | null, currency: CurrencyCode | string = 'USD'): string {
  if (!price) return "اتصل للسعر";
  const formatted = price.toLocaleString();
  const symbol = CURRENCY_SYMBOLS[currency];
  if (symbol) {
    // Put symbol before for $ £ €, after for Arabic currencies
    if (['$', '£', '€', '₺'].includes(symbol)) {
      return `${symbol}${formatted}`;
    }
    return `${formatted} ${symbol}`;
  }
  return `${formatted} ${currency}`;
}
