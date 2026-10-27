import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPublicHolidays,
  fetchAvailableCountries,
  analyzeFollowUpDate,
  POPULAR_COUNTRIES,
} from '@/lib/api/nager';

export const dynamic = 'force-dynamic';

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

    const result = await fetchPublicHolidays(year, country);

    if (action === 'check') {
      const date = searchParams.get('date');
      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Query parameter "date" is required for clash check.' },
          { status: 400 }
        );
      }
      const analysis = analyzeFollowUpDate(date, result.data);
      return NextResponse.json({
        success: true,
        date,
        country,
        analysis,
        serviceStatus: result.success ? 'healthy' : 'unavailable',
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Nager.Date public holidays service is currently unavailable.',
          country,
          year,
          holidays: [],
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      country,
      year,
      count: result.data.length,
      holidays: result.data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve public holidays.';
    console.error('Holidays route error:', message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        holidays: [],
      },
      { status: 500 }
    );
  }
}
