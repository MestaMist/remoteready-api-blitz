import { ExchangeRatesResponse } from '../types';
import { fetchWithRetry, memoryCache } from './httpClient';

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

export interface FrankfurterResult {
  data: ExchangeRatesResponse | null;
  success: boolean;
  error?: string;
}

export async function fetchExchangeRates(base = 'USD'): Promise<FrankfurterResult> {
  const normalizedBase = base.toUpperCase();
  const cacheKey = `frankfurter_rates_${normalizedBase}`;

  // Check in-memory cache first (1 hour TTL)
  const cached = memoryCache.get<ExchangeRatesResponse>(cacheKey);
  if (cached) {
    return { data: cached, success: true };
  }

  const primaryUrl = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(normalizedBase)}`;
  const fallbackUrl = `https://api.frankfurter.app/latest?base=${encodeURIComponent(normalizedBase)}`;

  try {
    const res = await fetchWithRetry(primaryUrl, {
      timeoutMs: 6000,
      retries: 1,
      retryDelayMs: 300,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`Frankfurter primary HTTP ${res.status}`);
    const data: ExchangeRatesResponse = await res.json();
    if (data?.rates) {
      data.rates[normalizedBase] = 1;
      memoryCache.set(cacheKey, data, 3600); // 1 hour
      return { data, success: true };
    }
    throw new Error('Invalid rates payload received');
  } catch (err1) {
    console.warn('[Frankfurter Warning] Primary endpoint failed, attempting fallback URL...', err1);
    try {
      const resFallback = await fetchWithRetry(fallbackUrl, {
        timeoutMs: 6000,
        retries: 1,
        retryDelayMs: 300,
        headers: { Accept: 'application/json' },
      });
      if (!resFallback.ok) throw new Error(`Frankfurter fallback HTTP ${resFallback.status}`);
      const data: ExchangeRatesResponse = await resFallback.json();
      if (data?.rates) {
        data.rates[normalizedBase] = 1;
        memoryCache.set(cacheKey, data, 3600); // 1 hour
        return { data, success: true };
      }
      throw new Error('Invalid fallback rates payload');
    } catch (err2: unknown) {
      const errorMsg = err2 instanceof Error ? err2.message : 'Exchange rates unavailable';
      console.error('[Frankfurter Error] All Frankfurter endpoints failed:', errorMsg);
      // DO NOT fabricate fake exchange rates! Return explicit failure.
      return { data: null, success: false, error: errorMsg };
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

  const rateX = fromCurrency === baseCurrency ? 1 : rates[fromCurrency];
  const rateY = toCurrency === baseCurrency ? 1 : rates[toCurrency];

  if (!rateX || !rateY) {
    return { converted: amount, rateUsed: 1 };
  }

  const effectiveRate = rateY / rateX;
  const converted = Math.round(amount * effectiveRate * 100) / 100;
  return { converted, rateUsed: effectiveRate };
}
