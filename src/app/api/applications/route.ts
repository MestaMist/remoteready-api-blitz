import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getApplications, createApplication } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({
      success: false,
      isDbConfigured: false,
      message: 'DATABASE_URL is not set. Data is running in local offline mode.',
      applications: [],
    });
  }

  try {
    const applications = await getApplications();
    return NextResponse.json({
      success: true,
      isDbConfigured: true,
      applications,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database query failed';
    return NextResponse.json(
      { success: false, error: message, applications: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.company_name || !body.role_title) {
      return NextResponse.json(
        { success: false, error: 'Company name and Role title are required.' },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json({
        success: false,
        isDbConfigured: false,
        message: 'Neon database is not configured yet. Application cannot be persisted to server database.',
      }, { status: 503 });
    }

    const application = await createApplication(body);
    return NextResponse.json({
      success: true,
      isDbConfigured: true,
      application,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create application';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
