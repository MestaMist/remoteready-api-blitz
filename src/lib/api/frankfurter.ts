import { ExchangeRatesResponse } from '../types';

export const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
];

export async function fetchExchangeRates(base = 'USD'): Promise<ExchangeRatesResponse> {
  const primaryUrl = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`;
  const fallbackUrl = `https://api.frankfurter.app/latest?base=${encodeURIComponent(base)}`;

  const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 }, // Cache 1 hour
      });
      if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    const data = await fetchWithTimeout(primaryUrl);
    // Ensure base currency has a rate of 1 in the rates mapping
    if (data && data.rates) {
      data.rates[base] = 1;
    }
    return data;
  } catch (err1) {
    console.warn('Frankfurter primary API failed, trying fallback...', err1);
    try {
      const data = await fetchWithTimeout(fallbackUrl);
      if (data && data.rates) {
        data.rates[base] = 1;
      }
      return data;
    } catch (err2) {
      console.error('All Frankfurter endpoints failed:', err2);
      // Sensible fallback rates if offline
      return {
        amount: 1,
        base,
        date: new Date().toISOString().split('T')[0],
        rates: {
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          INR: 86.5,
          CAD: 1.38,
          AUD: 1.54,
          SGD: 1.35,
          CHF: 0.89,
          JPY: 152.0,
        },
      };
    }
  }
}

export function convertSalary(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
  baseCurrency = 'USD'
): { converted: number; rateUsed: number } {
  if (fromCurrency === toCurrency) {
    return { converted: amount, rateUsed: 1 };
  }

  // Frankfurter rates are relative to baseCurrency:
  // 1 Base = rates[X] X
  // To convert from X to Y:
  // Base = amount / rates[X]
  // Y = Base * rates[Y] = amount * (rates[Y] / rates[X])
  const rateX = fromCurrency === baseCurrency ? 1 : rates[fromCurrency];
  const rateY = toCurrency === baseCurrency ? 1 : rates[toCurrency];

  if (!rateX || !rateY) {
    return { converted: amount, rateUsed: 1 };
  }

  const effectiveRate = rateY / rateX;
  const converted = Math.round(amount * effectiveRate * 100) / 100;
  return { converted, rateUsed: effectiveRate };
}
