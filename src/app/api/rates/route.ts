import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates, POPULAR_CURRENCIES } from '@/lib/api/frankfurter';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base') || 'USD';
    const rates = await fetchExchangeRates(base.toUpperCase());

    return NextResponse.json({
      success: true,
      data: rates,
      popularCurrencies: POPULAR_CURRENCIES,
    });
  } catch (error) {
    console.error('Frankfurter route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve exchange rates.',
      },
      { status: 500 }
    );
  }
}
