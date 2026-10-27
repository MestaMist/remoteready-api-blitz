import { Job } from '../types';

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
} = {}): Promise<Job[]> {
  const { search, category, limit = 50 } = options;
  const url = new URL('https://remotive.com/api/remote-jobs');
  
  if (search) {
    url.searchParams.set('search', search);
  }
  if (category) {
    url.searchParams.set('category', category);
  }
  url.searchParams.set('limit', String(limit));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RemoteReady-Client/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // Cache 5 mins
    });

    if (!res.ok) {
      throw new Error(`Remotive API responded with status ${res.status}`);
    }

    const data: RemotiveApiResponse = await res.json();
    if (!Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs.map((item): Job => {
      let jobType = 'Full-Time';
      if (item.job_type) {
        const jt = item.job_type.toLowerCase();
        if (jt.includes('contract') || jt.includes('freelance')) jobType = 'Contract';
        else if (jt.includes('part_time')) jobType = 'Part-Time';
        else if (jt.includes('internship')) jobType = 'Internship';
      }

      return {
        id: `remotive_${item.id}`,
        source: 'remotive',
        title: item.title,
        companyName: item.company_name,
        companyLogo: item.company_logo || undefined,
        category: item.category || 'Engineering',
        tags: Array.isArray(item.tags) ? item.tags : [],
        jobType,
        location: item.candidate_required_location || 'Worldwide Remote',
        salary: item.salary && item.salary.trim() !== '' ? item.salary : undefined,
        url: item.url,
        publishedAt: item.publication_date,
        descriptionHtml: item.description || '',
        isRemote: true,
      };
    });
  } catch (error) {
    console.error('Error fetching Remotive jobs:', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
