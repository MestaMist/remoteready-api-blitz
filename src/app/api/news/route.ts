import { NextRequest, NextResponse } from 'next/server';
import { fetchHackerNewsStories } from '@/lib/api/hackernews';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 minutes cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'all' | 'hiring' | 'tech' | 'ai' | 'career'
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    let stories = await fetchHackerNewsStories(limit);

    if (category && category !== 'all') {
      stories = stories.filter((s) => s.category === category);
    }

    return NextResponse.json({
      success: true,
      count: stories.length,
      stories,
    });
  } catch (error) {
    console.error('Hacker News route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve Hacker News stories.',
        stories: [],
      },
      { status: 500 }
    );
  }
}
