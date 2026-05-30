export function buildCacheHeaders(cacheSeconds: number): Record<string, string> {
  return {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
  };
}

export function buildNoCacheHeaders(): Record<string, string> {
  return {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'no-store, no-cache',
  };
}
