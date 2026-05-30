interface RateEntry {
  count: number;
  resetAt: number;
}

const requestCounts = new Map<string, RateEntry>();

export function checkRateLimit(ip: string, maxPerMinute = 60): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > maxPerMinute;
}
