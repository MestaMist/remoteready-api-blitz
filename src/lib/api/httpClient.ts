/**
 * Resilient HTTP Client with Timeout, Exponential Backoff Retries,
 * and In-Memory Normalized Caching to prevent Next.js 2MB Data Cache overflows.
 */

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory TTL cache for normalized data (bypasses Next.js 2MB fetch-cache limit)
class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new InMemoryCache();

/**
 * Robust fetch with timeout and retries with backoff
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 8000,
    retries = 2,
    retryDelayMs = 500,
    ...fetchInit
  } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
        // Never allow Next.js to cache raw upstream responses in .next/cache/fetch-cache
        // which triggers the 2MB limit error on large APIs like Arbeitnow.
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      // If server responded with 5xx error, retry
      if (response.status >= 500 && attempt < retries) {
        console.warn(`[HTTP] ${url} returned ${response.status}. Retrying (attempt ${attempt + 1}/${retries})...`);
        await new Promise((res) => setTimeout(res, retryDelayMs * Math.pow(2, attempt)));
        continue;
      }

      return response;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;

      const isAbort = (err as { name?: string })?.name === 'AbortError';
      const isTimeout =
        isAbort ||
        (err as { code?: string })?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        String(err).includes('CONNECT_TIMEOUT') ||
        String(err).includes('fetch failed');

      if (attempt < retries && isTimeout) {
        const backoff = retryDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
        console.warn(
          `[HTTP Timeout/Retry] ${url} failed on attempt ${attempt + 1}/${retries + 1} (${isAbort ? 'Timeout' : 'Network'}). Retrying in ${backoff}ms...`
        );
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}
