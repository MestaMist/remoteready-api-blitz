import { NextResponse } from 'next/server';
import { isDbConfigured, getSql, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'Neon PostgreSQL DATABASE_URL is not configured. Add your connection string to .env.local to enable server persistence.',
      tables: {
        applications: false,
        saved_jobs: false,
        user_preferences: false,
      },
      counts: {
        applications: 0,
        saved_jobs: 0,
      },
    });
  }

  try {
    const sql = getSql();
    // Test basic connection
    await sql`SELECT 1;`;

    // Attempt table initialization if not already created
    try {
      await initDb();
    } catch (e) {
      console.warn('Auto table init warning:', e);
    }

    const appCountRes = await sql`SELECT count(*)::int as count FROM applications;`;
    const savedCountRes = await sql`SELECT count(*)::int as count FROM saved_jobs;`;

    return NextResponse.json({
      connected: true,
      message: 'Successfully connected to Neon PostgreSQL.',
      tables: {
        applications: true,
        saved_jobs: true,
        user_preferences: true,
      },
      counts: {
        applications: appCountRes[0]?.count ?? 0,
        saved_jobs: savedCountRes[0]?.count ?? 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({
      connected: false,
      message: `Failed to connect to Neon PostgreSQL: ${message}`,
      error: message,
    });
  }
}
