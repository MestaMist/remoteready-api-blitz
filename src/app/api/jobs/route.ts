import { NextRequest, NextResponse } from 'next/server';
import { fetchRemotiveJobs } from '@/lib/api/remotive';
import { fetchArbeitnowJobs, ProviderResult } from '@/lib/api/arbeitnow';
import { Job } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const sourceFilter = searchParams.get('source') || 'all'; // 'all' | 'remotive' | 'arbeitnow'
    const typeFilter = searchParams.get('type') || 'all'; // 'all' | 'full-time' | 'contract' | 'internship'
    const sort = searchParams.get('sort') || 'newest'; // 'newest' | 'company' | 'title'

    // Fetch from both sources in parallel with fault tolerance
    const [remotiveResult, arbeitnowResult] = await Promise.all([
      sourceFilter === 'arbeitnow'
        ? Promise.resolve<ProviderResult<Job[]>>({ data: [], success: true })
        : fetchRemotiveJobs({ search }),
      sourceFilter === 'remotive'
        ? Promise.resolve<ProviderResult<Job[]>>({ data: [], success: true })
        : fetchArbeitnowJobs(),
    ]);

    const remotiveJobs = remotiveResult.data;
    const arbeitnowJobs = arbeitnowResult.data;

    // Deduplication logic: map by simplified `company_name + title`
    const seenMap = new Map<string, Job>();

    const normalizeKey = (title: string, company: string) => {
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${cleanCompany}_${cleanTitle}`;
    };

    for (const job of remotiveJobs) {
      const key = normalizeKey(job.title, job.companyName);
      seenMap.set(key, job);
    }

    for (const job of arbeitnowJobs) {
      const key = normalizeKey(job.title, job.companyName);
      if (!seenMap.has(key)) {
        seenMap.set(key, job);
      }
    }

    let combinedJobs = Array.from(seenMap.values());

    // Apply text search across title, company, tags, location
    if (search) {
      combinedJobs = combinedJobs.filter((j) => {
        return (
          j.title.toLowerCase().includes(search) ||
          j.companyName.toLowerCase().includes(search) ||
          j.location.toLowerCase().includes(search) ||
          j.tags.some((tag) => tag.toLowerCase().includes(search)) ||
          (j.category && j.category.toLowerCase().includes(search))
        );
      });
    }

    // Apply job type filter
    if (typeFilter !== 'all') {
      const tf = typeFilter.toLowerCase();
      combinedJobs = combinedJobs.filter((j) => j.jobType.toLowerCase().includes(tf));
    }

    // Sorting
    if (sort === 'company') {
      combinedJobs.sort((a, b) => a.companyName.localeCompare(b.companyName));
    } else if (sort === 'title') {
      combinedJobs.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default newest first
      combinedJobs.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }

    return NextResponse.json({
      success: true,
      jobs: combinedJobs,
      total: combinedJobs.length,
      providers: {
        remotive: {
          status: remotiveResult.success ? 'healthy' : 'unavailable',
          count: remotiveJobs.length,
          error: remotiveResult.error,
        },
        arbeitnow: {
          status: arbeitnowResult.success ? 'healthy' : 'unavailable',
          count: arbeitnowJobs.length,
          error: arbeitnowResult.error,
        },
      },
      counts: {
        remotive: remotiveJobs.length,
        arbeitnow: arbeitnowJobs.length,
        combined: combinedJobs.length,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to retrieve remote jobs';
    console.error('Unified jobs route error:', errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        jobs: [],
        total: 0,
        providers: {
          remotive: { status: 'unavailable', count: 0, error: errorMsg },
          arbeitnow: { status: 'unavailable', count: 0, error: errorMsg },
        },
      },
      { status: 200 } // Return 200 with clear error structure rather than breaking caller
    );
  }
}
