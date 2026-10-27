import { Job } from '../types';

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

export async function fetchArbeitnowJobs(options: {
  page?: number;
} = {}): Promise<Job[]> {
  const { page = 1 } = options;
  const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RemoteReady-Client/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // Cache 5 mins
    });

    if (!res.ok) {
      throw new Error(`Arbeitnow API responded with status ${res.status}`);
    }

    const data: ArbeitnowApiResponse = await res.json();
    if (!Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item): Job => {
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

      return {
        id: `arbeitnow_${item.slug}`,
        source: 'arbeitnow',
        title: item.title,
        companyName: item.company_name,
        companyLogo: undefined,
        category: item.tags?.[0] || 'Software Development',
        tags: Array.isArray(item.tags) ? item.tags : [],
        jobType,
        location,
        salary: undefined, // Arbeitnow rarely provides explicit salary numbers
        url: item.url,
        publishedAt: publishedIso,
        descriptionHtml: item.description || '',
        isRemote: Boolean(item.remote),
      };
    });
  } catch (error) {
    console.error('Error fetching Arbeitnow jobs:', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
