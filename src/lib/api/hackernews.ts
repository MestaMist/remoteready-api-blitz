import { HackerNewsStory } from '../types';

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

export async function fetchHNItem(id: number): Promise<HNItemRaw | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
      signal: controller.signal,
      next: { revalidate: 600 }, // Cache 10 mins
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchHackerNewsStories(limit = 30): Promise<HackerNewsStory[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // Fetch both topstories and jobstories from the official HN API
    const [topRes, jobRes] = await Promise.allSettled([
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
        signal: controller.signal,
        next: { revalidate: 600 },
      }),
      fetch('https://hacker-news.firebaseio.com/v0/jobstories.json', {
        signal: controller.signal,
        next: { revalidate: 600 },
      }),
    ]);

    const topIds: number[] = topRes.status === 'fulfilled' && topRes.value.ok ? await topRes.value.json() : [];
    const jobIds: number[] = jobRes.status === 'fulfilled' && jobRes.value.ok ? await jobRes.value.json() : [];

    // Interleave hiring/job stories and top tech stories
    const selectedJobIds = jobIds.slice(0, 8);
    const selectedTopIds = topIds.slice(0, limit - selectedJobIds.length);
    const combinedIds = Array.from(new Set([...selectedJobIds, ...selectedTopIds]));

    // Fetch details concurrently
    const itemPromises = combinedIds.map((id) => fetchHNItem(id));
    const itemsSettled = await Promise.allSettled(itemPromises);

    const stories: HackerNewsStory[] = [];

    for (const settled of itemsSettled) {
      if (settled.status !== 'fulfilled' || !settled.value) continue;
      const item = settled.value;
      if (!item.title || item.deleted || item.dead) continue;

      const titleLower = item.title.toLowerCase();
      let category: HackerNewsStory['category'] = 'general';

      if (item.type === 'job' || titleLower.includes('hiring') || titleLower.includes('who is hiring') || titleLower.includes('internship')) {
        category = 'hiring';
      } else if (titleLower.includes('ai') || titleLower.includes('llm') || titleLower.includes('gpt') || titleLower.includes('agent') || titleLower.includes('model')) {
        category = 'ai';
      } else if (titleLower.includes('layoffs') || titleLower.includes('salary') || titleLower.includes('remote') || titleLower.includes('career') || titleLower.includes('engineer')) {
        category = 'career';
      } else if (titleLower.includes('react') || titleLower.includes('next.js') || titleLower.includes('rust') || titleLower.includes('python') || titleLower.includes('database') || titleLower.includes('cloud')) {
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

    return stories;
  } catch (error) {
    console.error('Error fetching Hacker News stories:', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
