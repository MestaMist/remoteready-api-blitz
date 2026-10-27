import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPublicHolidays,
  fetchAvailableCountries,
  analyzeFollowUpDate,
  POPULAR_COUNTRIES,
} from '@/lib/api/nager';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const country = (searchParams.get('country') || 'US').toUpperCase();
    const currentYear = new Date().getFullYear();
    const year = parseInt(searchParams.get('year') || String(currentYear), 10);

    if (action === 'countries') {
      const countries = await fetchAvailableCountries();
      return NextResponse.json({
        success: true,
        countries: countries.length > 0 ? countries : POPULAR_COUNTRIES,
      });
    }

    const holidays = await fetchPublicHolidays(year, country);

    if (action === 'check') {
      const date = searchParams.get('date');
      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Query parameter "date" is required for clash check.' },
          { status: 400 }
        );
      }
      const analysis = analyzeFollowUpDate(date, holidays);
      return NextResponse.json({
        success: true,
        date,
        country,
        analysis,
      });
    }

    return NextResponse.json({
      success: true,
      country,
      year,
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    console.error('Holidays route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve public holidays.',
        holidays: [],
      },
      { status: 500 }
    );
  }
}
