export type CurrencyCode = 'USD' | 'AED' | 'SAR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'دولار أمريكي' },
  AED: { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي' },
  SAR: { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي' },
};

export const CURRENCY_STORAGE_KEY = 'userCurrency';

export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCIES[code]?.symbol ?? '$';
}
