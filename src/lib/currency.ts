export type CurrencyCode = 'USD' | 'AED' | 'SAR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'دولار أمريكي', flag: '🇺🇸' },
  AED: { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي', flag: '🇦🇪' },
  SAR: { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي', flag: '🇸🇦' },
};

export const CURRENCY_STORAGE_KEY = 'userCurrency';

export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCIES[code]?.symbol ?? '$';
}
