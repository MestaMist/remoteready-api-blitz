import { PublicHoliday, CountryOption } from '../types';

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

export async function fetchPublicHolidays(year: number, countryCode = 'US'): Promise<PublicHoliday[]> {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode.toUpperCase()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // Cache 24 hours
    });

    if (!res.ok) {
      throw new Error(`Nager.Date API HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error fetching public holidays for ${countryCode} in ${year}:`, err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAvailableCountries(): Promise<CountryOption[]> {
  const url = 'https://date.nager.at/api/v3/AvailableCountries';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // Cache 24 hours
    });

    if (!res.ok) {
      return POPULAR_COUNTRIES;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((c: { countryCode: string; name: string }) => ({
        countryCode: c.countryCode,
        name: c.name,
      }));
    }
    return POPULAR_COUNTRIES;
  } catch (err) {
    console.error('Error fetching available countries:', err);
    return POPULAR_COUNTRIES;
  } finally {
    clearTimeout(timeoutId);
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
  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const yyyyMmDd = dateString.split('T')[0];
  const matchingHoliday = holidays.find((h) => h.date === yyyyMmDd);
  const isHoliday = Boolean(matchingHoliday);

  let warningMessage: string | undefined;
  if (isHoliday && isWeekend) {
    warningMessage = `This date is both a weekend and a public holiday (${matchingHoliday?.name}). Hiring managers will likely be out of office.`;
  } else if (isHoliday) {
    warningMessage = `This date is a public holiday (${matchingHoliday?.name}). Avoid sending follow-ups on official holidays.`;
  } else if (isWeekend) {
    warningMessage = 'This date falls on a weekend. Emails sent during weekends often get buried by Monday morning.';
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
