import { prisma } from "@/lib/db";

/**
 * Simple in-memory rate limiter (per user per day)
 * In production, consider using Redis or a dedicated rate limiting service
 */
const rateLimitCache = new Map<string, { count: number; date: string }>();

const MAX_REQUESTS_PER_DAY = 10;

/**
 * Check and increment rate limit for a user
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `${userId}:${today}`;

  const cached = rateLimitCache.get(key);

  if (cached && cached.date === today) {
    if (cached.count >= MAX_REQUESTS_PER_DAY) {
      return false;
    }
    cached.count++;
    rateLimitCache.set(key, cached);
  } else {
    rateLimitCache.set(key, { count: 1, date: today });
  }

  // Clean up old entries (older than 1 day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  for (const [cacheKey, value] of rateLimitCache.entries()) {
    if (value.date < yesterdayStr) {
      rateLimitCache.delete(cacheKey);
    }
  }

  return true;
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string): {
  allowed: boolean;
  remaining: number;
  resetDate: string;
} {
  const today = new Date().toISOString().split("T")[0];
  const key = `${userId}:${today}`;
  const cached = rateLimitCache.get(key);

  if (cached && cached.date === today) {
    return {
      allowed: cached.count < MAX_REQUESTS_PER_DAY,
      remaining: Math.max(0, MAX_REQUESTS_PER_DAY - cached.count),
      resetDate: today,
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_DAY,
    resetDate: today,
  };
}
