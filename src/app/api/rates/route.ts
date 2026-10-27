import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates, POPULAR_CURRENCIES } from '@/lib/api/frankfurter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base') || 'USD';
    const result = await fetchExchangeRates(base.toUpperCase());

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Frankfurter exchange rates service is currently unavailable.',
          popularCurrencies: POPULAR_CURRENCIES,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      popularCurrencies: POPULAR_CURRENCIES,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve exchange rates.';
    console.error('Frankfurter route error:', message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
