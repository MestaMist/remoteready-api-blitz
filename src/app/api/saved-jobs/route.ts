import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getSavedJobs, saveJob } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({
      success: false,
      isDbConfigured: false,
      message: 'DATABASE_URL is not set.',
      savedJobs: [],
    });
  }

  try {
    const savedJobs = await getSavedJobs();
    return NextResponse.json({
      success: true,
      isDbConfigured: true,
      savedJobs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database query failed';
    return NextResponse.json(
      { success: false, error: message, savedJobs: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.company_name || !body.job_url) {
      return NextResponse.json(
        { success: false, error: 'Title, company name, and job url are required.' },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json({
        success: false,
        isDbConfigured: false,
        message: 'Neon database is not configured. Saved jobs are maintained locally in browser.',
      }, { status: 503 });
    }

    const saved = await saveJob(body);
    return NextResponse.json({
      success: true,
      isDbConfigured: true,
      savedJob: saved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save job';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
