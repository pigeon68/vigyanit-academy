import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  expiresAt: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  // Simple pruning to avoid unbounded memory growth.
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) {
      if (bucket.expiresAt <= now) buckets.delete(key);
    }
  }
}

export function getClientIdentifier(request: NextRequest | Request): string {
  if (request instanceof NextRequest) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
  } else if (request.headers) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
  }
  return "unknown";
}

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(options.key);
  if (!existing || existing.expiresAt <= now) {
    buckets.set(options.key, {
      count: 1,
      expiresAt: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.expiresAt,
    };
  }

  existing.count += 1;
  buckets.set(options.key, existing);

  return {
    success: true,
    remaining: Math.max(options.limit - existing.count, 0),
    resetAt: existing.expiresAt,
  };
}
