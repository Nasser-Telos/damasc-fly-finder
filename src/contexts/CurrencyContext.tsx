import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type CurrencyCode, CURRENCIES, CURRENCY_STORAGE_KEY } from '@/lib/currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function getInitialCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && stored in CURRENCIES) return stored as CurrencyCode;
  } catch {
    // localStorage unavailable
  }
  return 'USD';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getInitialCurrency);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const symbol = CURRENCIES[currency].symbol;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
