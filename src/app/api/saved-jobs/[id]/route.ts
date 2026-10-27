import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, removeSavedJob } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const removed = await removeSavedJob(id);
    return NextResponse.json({
      success: removed,
      message: removed ? 'Job removed from bookmarks.' : 'Job not found in bookmarks.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete saved job';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
