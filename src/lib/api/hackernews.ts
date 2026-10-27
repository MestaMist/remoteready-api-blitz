import { HackerNewsStory } from '../types';
import { fetchWithRetry, memoryCache } from './httpClient';

interface HNItemRaw {
  id: number;
  deleted?: boolean;
  type: string;
  by?: string;
  time: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  descendants?: number;
}

export interface HNResult {
  stories: HackerNewsStory[];
  success: boolean;
  error?: string;
}

export async function fetchHNItem(id: number): Promise<HNItemRaw | null> {
  const cacheKey = `hn_item_${id}`;
  const cached = memoryCache.get<HNItemRaw>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithRetry(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
      timeoutMs: 4500,
      retries: 1,
      retryDelayMs: 250,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;
    const item: HNItemRaw = await res.json();
    if (item && item.title) {
      memoryCache.set(cacheKey, item, 600); // 10 mins
    }
    return item;
  } catch {
    return null;
  }
}

// Concurrency helper to avoid socket pool exhaustion
async function pMap<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(mapper));
    results.push(...chunkResults);
  }
  return results;
}

export async function fetchHackerNewsStories(limit = 25): Promise<HNResult> {
  const cacheKey = `hn_radar_feed_${limit}`;
  const cached = memoryCache.get<HackerNewsStory[]>(cacheKey);
  if (cached) {
    return { stories: cached, success: true };
  }

  try {
    const [topRes, jobRes] = await Promise.allSettled([
      fetchWithRetry('https://hacker-news.firebaseio.com/v0/topstories.json', {
        timeoutMs: 5000,
        retries: 1,
        headers: { Accept: 'application/json' },
      }),
      fetchWithRetry('https://hacker-news.firebaseio.com/v0/jobstories.json', {
        timeoutMs: 5000,
        retries: 1,
        headers: { Accept: 'application/json' },
      }),
    ]);

    const topIds: number[] =
      topRes.status === 'fulfilled' && topRes.value.ok ? await topRes.value.json() : [];
    const jobIds: number[] =
      jobRes.status === 'fulfilled' && jobRes.value.ok ? await jobRes.value.json() : [];

    if (topIds.length === 0 && jobIds.length === 0) {
      throw new Error('No stories returned from Hacker News endpoints');
    }

    // Interleave job stories and top stories
    const selectedJobIds = jobIds.slice(0, 6);
    const selectedTopIds = topIds.slice(0, limit - selectedJobIds.length);
    const combinedIds = Array.from(new Set([...selectedJobIds, ...selectedTopIds]));

    // Fetch details in controlled concurrent batches of 5 to avoid socket timeout / UND_ERR_CONNECT_TIMEOUT
    const items = await pMap(combinedIds, (id) => fetchHNItem(id), 5);

    const stories: HackerNewsStory[] = [];

    for (const item of items) {
      if (!item || !item.title || item.deleted || item.dead) continue;

      const titleLower = item.title.toLowerCase();
      let category: HackerNewsStory['category'] = 'general';

      if (
        item.type === 'job' ||
        titleLower.includes('hiring') ||
        titleLower.includes('who is hiring') ||
        titleLower.includes('internship')
      ) {
        category = 'hiring';
      } else if (
        titleLower.includes('ai') ||
        titleLower.includes('llm') ||
        titleLower.includes('gpt') ||
        titleLower.includes('agent') ||
        titleLower.includes('model')
      ) {
        category = 'ai';
      } else if (
        titleLower.includes('layoffs') ||
        titleLower.includes('salary') ||
        titleLower.includes('remote') ||
        titleLower.includes('career') ||
        titleLower.includes('engineer')
      ) {
        category = 'career';
      } else if (
        titleLower.includes('react') ||
        titleLower.includes('next.js') ||
        titleLower.includes('rust') ||
        titleLower.includes('python') ||
        titleLower.includes('database') ||
        titleLower.includes('cloud') ||
        titleLower.includes('postgres')
      ) {
        category = 'tech';
      }

      stories.push({
        id: item.id,
        title: item.title,
        by: item.by || 'anonymous',
        score: item.score || (item.type === 'job' ? 1 : 0),
        descendants: item.descendants || 0,
        time: item.time,
        url: item.url || undefined,
        hnUrl: `https://news.ycombinator.com/item?id=${item.id}`,
        category,
      });
    }

    if (stories.length > 0) {
      memoryCache.set(cacheKey, stories, 600); // 10 mins
    }

    return { stories, success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Hacker News API connection timeout';
    console.error('[Hacker News Warning]:', errorMsg);
    // DO NOT fabricate fake stories
    return { stories: [], success: false, error: errorMsg };
  }
}
