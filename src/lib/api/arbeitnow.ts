import { Job } from '../types';
import { fetchWithRetry, memoryCache } from './httpClient';

interface ArbeitnowJobRaw {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at: number;
}

interface ArbeitnowApiResponse {
  data: ArbeitnowJobRaw[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface ProviderResult<T> {
  data: T;
  success: boolean;
  error?: string;
}

export async function fetchArbeitnowJobs(options: {
  page?: number;
} = {}): Promise<ProviderResult<Job[]>> {
  const { page = 1 } = options;
  const cacheKey = `arbeitnow_normalized_page_${page}`;

  // Check in-memory cache for normalized data first
  const cached = memoryCache.get<Job[]>(cacheKey);
  if (cached) {
    return { data: cached, success: true };
  }

  const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;

  try {
    const res = await fetchWithRetry(url, {
      timeoutMs: 9000,
      retries: 2,
      retryDelayMs: 400,
      headers: {
        'User-Agent': 'RemoteReady-JobEngine/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Arbeitnow API returned HTTP ${res.status}`);
    }

    const json: ArbeitnowApiResponse = await res.json();
    if (!Array.isArray(json.data)) {
      return { data: [], success: true };
    }

    // Normalize and retain ONLY required fields with bounded description size to save memory
    const normalized: Job[] = json.data.slice(0, 100).map((item): Job => {
      let jobType = 'Full-Time';
      if (item.job_types && item.job_types.length > 0) {
        const typesCombined = item.job_types.join(' ').toLowerCase();
        if (typesCombined.includes('part') || typesCombined.includes('teilzeit')) jobType = 'Part-Time';
        else if (typesCombined.includes('intern') || typesCombined.includes('praktik')) jobType = 'Internship';
        else if (typesCombined.includes('contract') || typesCombined.includes('freelance')) jobType = 'Contract';
      }

      const publishedIso = new Date(item.created_at * 1000).toISOString();
      const location = item.remote
        ? (item.location ? `${item.location} (Remote)` : 'Remote')
        : (item.location || 'Hybrid / On-site');

      // Bound description size (max 4,000 characters) to prevent multi-megabyte payloads in memory
      let descriptionHtml = item.description || '';
      if (descriptionHtml.length > 4000) {
        descriptionHtml = descriptionHtml.slice(0, 4000) + '... <p><em>(Visit source link for full listing)</em></p>';
      }

      return {
        id: `arbeitnow_${item.slug}`,
        source: 'arbeitnow',
        title: item.title,
        companyName: item.company_name,
        companyLogo: undefined,
        category: item.tags?.[0] || 'Engineering',
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 8) : [],
        jobType,
        location,
        salary: undefined,
        url: item.url,
        publishedAt: publishedIso,
        descriptionHtml,
        isRemote: Boolean(item.remote),
      };
    });

    // Cache the small normalized result (approx 80 KB vs 2.5 MB raw)
    memoryCache.set(cacheKey, normalized, 300); // 5 mins

    return { data: normalized, success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Arbeitnow API connection timeout';
    console.error('[Arbeitnow Provider Warning]:', errorMsg);
    return { data: [], success: false, error: errorMsg };
  }
}
