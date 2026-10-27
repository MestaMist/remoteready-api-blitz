import { Job } from '../types';
import { fetchWithRetry, memoryCache } from './httpClient';
import { ProviderResult } from './arbeitnow';

interface RemotiveJobRaw {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date: string;
  candidate_required_location?: string;
  salary?: string;
  description: string;
}

interface RemotiveApiResponse {
  'job-count': number;
  jobs: RemotiveJobRaw[];
}

export async function fetchRemotiveJobs(options: {
  search?: string;
  category?: string;
  limit?: number;
} = {}): Promise<ProviderResult<Job[]>> {
  const { search = '', category = '', limit = 50 } = options;
  const cacheKey = `remotive_normalized_${search}_${category}_${limit}`;

  const cached = memoryCache.get<Job[]>(cacheKey);
  if (cached) {
    return { data: cached, success: true };
  }

  const url = new URL('https://remotive.com/api/remote-jobs');
  if (search) url.searchParams.set('search', search);
  if (category) url.searchParams.set('category', category);
  url.searchParams.set('limit', String(limit));

  try {
    const res = await fetchWithRetry(url.toString(), {
      timeoutMs: 9000,
      retries: 2,
      retryDelayMs: 400,
      headers: {
        'User-Agent': 'RemoteReady-JobEngine/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Remotive API returned HTTP ${res.status}`);
    }

    const data: RemotiveApiResponse = await res.json();
    if (!Array.isArray(data.jobs)) {
      return { data: [], success: true };
    }

    const normalized: Job[] = data.jobs.map((item): Job => {
      let jobType = 'Full-Time';
      if (item.job_type) {
        const jt = item.job_type.toLowerCase();
        if (jt.includes('contract') || jt.includes('freelance')) jobType = 'Contract';
        else if (jt.includes('part_time')) jobType = 'Part-Time';
        else if (jt.includes('internship')) jobType = 'Internship';
      }

      let descriptionHtml = item.description || '';
      if (descriptionHtml.length > 4000) {
        descriptionHtml = descriptionHtml.slice(0, 4000) + '... <p><em>(Visit source link for full listing)</em></p>';
      }

      return {
        id: `remotive_${item.id}`,
        source: 'remotive',
        title: item.title,
        companyName: item.company_name,
        companyLogo: item.company_logo || undefined,
        category: item.category || 'Engineering',
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 8) : [],
        jobType,
        location: item.candidate_required_location || 'Worldwide Remote',
        salary: item.salary && item.salary.trim() !== '' ? item.salary : undefined,
        url: item.url,
        publishedAt: item.publication_date,
        descriptionHtml,
        isRemote: true,
      };
    });

    memoryCache.set(cacheKey, normalized, 300); // 5 mins

    return { data: normalized, success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Remotive API connection timeout';
    console.error('[Remotive Provider Warning]:', errorMsg);
    return { data: [], success: false, error: errorMsg };
  }
}
