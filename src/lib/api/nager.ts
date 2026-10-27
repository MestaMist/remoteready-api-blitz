import { PublicHoliday, CountryOption } from '../types';
import { fetchWithRetry, memoryCache } from './httpClient';

export const POPULAR_COUNTRIES: CountryOption[] = [
  { countryCode: 'US', name: 'United States' },
  { countryCode: 'GB', name: 'United Kingdom' },
  { countryCode: 'IN', name: 'India' },
  { countryCode: 'DE', name: 'Germany' },
  { countryCode: 'CA', name: 'Canada' },
  { countryCode: 'AU', name: 'Australia' },
  { countryCode: 'NL', name: 'Netherlands' },
  { countryCode: 'FR', name: 'France' },
  { countryCode: 'SG', name: 'Singapore' },
  { countryCode: 'IE', name: 'Ireland' },
];

export interface NagerResult {
  data: PublicHoliday[];
  success: boolean;
  error?: string;
}

export async function fetchPublicHolidays(year: number, countryCode = 'US'): Promise<NagerResult> {
  const normalizedCountry = countryCode.toUpperCase();
  const cacheKey = `nager_holidays_${year}_${normalizedCountry}`;

  const cached = memoryCache.get<PublicHoliday[]>(cacheKey);
  if (cached) {
    return { data: cached, success: true };
  }

  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${normalizedCountry}`;

  try {
    const res = await fetchWithRetry(url, {
      timeoutMs: 7000,
      retries: 2,
      retryDelayMs: 400,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Nager.Date API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return { data: [], success: true };
    }

    memoryCache.set(cacheKey, data, 86400); // 24 hours
    return { data, success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Nager.Date service unavailable';
    console.error(`[Nager.Date Error] ${countryCode} in ${year}:`, errorMsg);
    // DO NOT fabricate fake holidays
    return { data: [], success: false, error: errorMsg };
  }
}

export async function fetchAvailableCountries(): Promise<CountryOption[]> {
  const cacheKey = 'nager_available_countries';
  const cached = memoryCache.get<CountryOption[]>(cacheKey);
  if (cached) return cached;

  const url = 'https://date.nager.at/api/v3/AvailableCountries';

  try {
    const res = await fetchWithRetry(url, {
      timeoutMs: 6000,
      retries: 1,
      retryDelayMs: 300,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return POPULAR_COUNTRIES;

    const data = await res.json();
    if (Array.isArray(data)) {
      const formatted = data.map((c: { countryCode: string; name: string }) => ({
        countryCode: c.countryCode,
        name: c.name,
      }));
      memoryCache.set(cacheKey, formatted, 86400 * 7); // 7 days
      return formatted;
    }
    return POPULAR_COUNTRIES;
  } catch (err) {
    console.warn('[Nager.Date Warning] Could not fetch countries list, using defaults:', err);
    return POPULAR_COUNTRIES;
  }
}

export interface DateClashAnalysis {
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  recommendedDate: string; // YYYY-MM-DD
  warningMessage?: string;
}

export function analyzeFollowUpDate(
  dateString: string,
  holidays: PublicHoliday[]
): DateClashAnalysis {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const yyyyMmDd = dateString.split('T')[0];
  const matchingHoliday = holidays.find((h) => h.date === yyyyMmDd);
  const isHoliday = Boolean(matchingHoliday);

  let warningMessage: string | undefined;
  if (isHoliday && isWeekend) {
    warningMessage = `This date is both a weekend and a public holiday (${matchingHoliday?.name}). Hiring teams will be out of office.`;
  } else if (isHoliday) {
    warningMessage = `This date is an official public holiday (${matchingHoliday?.name}). Recruiter responses will be delayed.`;
  } else if (isWeekend) {
    warningMessage = 'This date falls on a weekend. Follow-up emails sent over weekends risk getting buried by Monday morning.';
  }

  // Calculate next safe business day
  const nextSafe = new Date(date);
  let attempts = 0;
  while (attempts < 14) {
    if (attempts > 0 || isWeekend || isHoliday) {
      nextSafe.setDate(nextSafe.getDate() + 1);
    }
    const currentDow = nextSafe.getDay();
    const currentStr = nextSafe.toISOString().split('T')[0];
    const isCurrentWeekend = currentDow === 0 || currentDow === 6;
    const isCurrentHoliday = holidays.some((h) => h.date === currentStr);

    if (!isCurrentWeekend && !isCurrentHoliday) {
      break;
    }
    attempts++;
  }

  return {
    isWeekend,
    isHoliday,
    holidayName: matchingHoliday?.name,
    recommendedDate: nextSafe.toISOString().split('T')[0],
    warningMessage,
  };
}
