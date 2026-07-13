/**
 * Rate limiter with two backends:
 *
 * - Upstash Redis (REST API, works from any serverless/edge runtime via
 *   plain fetch — no TCP client needed) when UPSTASH_REDIS_REST_URL /
 *   UPSTASH_REDIS_REST_TOKEN are set. This is what makes rate limiting
 *   correct across multiple server instances.
 * - An in-memory Map fallback otherwise, so local dev works with zero
 *   setup. This fallback is per-process only — fine for one instance,
 *   not for a horizontally-scaled deployment.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function isRedisConfigured(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

export type RateLimitResult = { success: boolean; remaining: number; resetAt: number };

// ---- In-memory fallback ----

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

function rateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// ---- Upstash Redis (REST) backend ----

async function redisCommand(...args: (string | number)[]): Promise<any> {
  const res = await fetch(`${UPSTASH_URL}/${args.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash command failed: ${res.status}`);
  const body = await res.json();
  return body.result;
}

async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  // INCR then, only on the first hit, set the expiry — this mirrors a
  // simple fixed-window counter, which is enough precision for login/
  // signup/inquiry throttling without needing Lua scripts.
  const count = await redisCommand("INCR", redisKey);
  if (count === 1) {
    await redisCommand("EXPIRE", redisKey, windowSeconds);
  }
  const ttl = await redisCommand("TTL", redisKey);
  const resetAt = Date.now() + Math.max(ttl, 0) * 1000;

  if (count > limit) {
    return { success: false, remaining: 0, resetAt };
  }
  return { success: true, remaining: limit - count, resetAt };
}

/**
 * @param key    unique identifier for the caller+route, e.g. `login:1.2.3.4`
 * @param limit  max requests allowed within the window
 * @param windowMs  window size in milliseconds
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (isRedisConfigured()) {
    try {
      return await rateLimitRedis(key, limit, windowMs);
    } catch (err) {
      // Fail open to in-memory rather than blocking every request if
      // Upstash has a hiccup — a rate limiter should never be the reason
      // the whole app goes down.
      console.error("[rate-limit] Redis error, falling back to in-memory", err);
      return rateLimitInMemory(key, limit, windowMs);
    }
  }
  return rateLimitInMemory(key, limit, windowMs);
}

/** Best-effort client IP extraction behind common proxies (Render, Cloudflare, Vercel). */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}
