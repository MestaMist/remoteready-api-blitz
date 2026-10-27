import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, updateApplication, deleteApplication } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!isDbConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database is not configured.' },
        { status: 503 }
      );
    }

    const updated = await updateApplication(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Application not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update application';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isDbConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database is not configured.' },
        { status: 503 }
      );
    }

    const deleted = await deleteApplication(id);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Application deleted.' : 'Application not found.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete application';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
