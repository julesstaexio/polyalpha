import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter for CLOB API calls (10 req/s per user)
export const clobRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 s"),
  analytics: true,
  prefix: "polyalpha:clob",
});

// Rate limiter for AI analysis (5 req/min per user)
export const analysisRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "polyalpha:analysis",
});

// Cache helpers
const DEFAULT_TTL = 10; // seconds

export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}
