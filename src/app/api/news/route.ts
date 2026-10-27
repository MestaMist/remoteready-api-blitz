import { NextRequest, NextResponse } from 'next/server';
import { fetchHackerNewsStories } from '@/lib/api/hackernews';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'all' | 'hiring' | 'tech' | 'ai' | 'career'
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const result = await fetchHackerNewsStories(limit);

    if (!result.success && result.stories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Hacker News API is currently unreachable.',
          stories: [],
          count: 0,
        },
        { status: 503 }
      );
    }

    let stories = result.stories;
    if (category && category !== 'all') {
      stories = stories.filter((s) => s.category === category);
    }

    return NextResponse.json({
      success: true,
      count: stories.length,
      stories,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve Hacker News stories.';
    console.error('Hacker News route error:', message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        stories: [],
      },
      { status: 500 }
    );
  }
}
