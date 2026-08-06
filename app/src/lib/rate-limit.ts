const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const ipHits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const current = ipHits.get(ip);

  if (!current || now > current.resetAt) {
    const resetAt = now + WINDOW_MS;
    ipHits.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (current.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  ipHits.set(ip, current);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - current.count,
    resetAt: current.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
