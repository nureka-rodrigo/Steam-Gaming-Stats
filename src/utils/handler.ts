import type { HandlerEvent, HandlerResponse } from '@netlify/functions';
import { SteamError } from '../steam/client';
import { buildErrorSvg } from '../svg/renderer';
import { buildCacheHeaders, buildNoCacheHeaders } from './response';
import { checkRateLimit } from './ratelimit';

export type CardRenderer = (event: HandlerEvent) => Promise<string>;

export async function withErrorHandling(
  event: HandlerEvent,
  cacheSeconds: number,
  render: CardRenderer,
): Promise<HandlerResponse> {
  const ip =
    event.headers['x-nf-client-connection-ip'] ?? event.headers['x-forwarded-for'] ?? 'unknown';

  if (checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers: buildNoCacheHeaders(),
      body: buildErrorSvg('Too Many Requests', 'Please wait before making more requests.'),
    };
  }

  try {
    const svg = await render(event);
    return {
      statusCode: 200,
      headers: buildCacheHeaders(cacheSeconds),
      body: svg,
    };
  } catch (err) {
    const headers = buildNoCacheHeaders();
    if (err instanceof SteamError) {
      switch (err.code) {
        case 'not_found':
          return {
            statusCode: 200,
            headers,
            body: buildErrorSvg(
              'Steam ID Not Found',
              'Check that the steamid parameter is correct.',
            ),
          };
        case 'private':
          return {
            statusCode: 200,
            headers,
            body: buildErrorSvg(
              'Profile is Private',
              'Make your Steam profile public to use this card.',
            ),
          };
        case 'network':
          return {
            statusCode: 200,
            headers,
            body: buildErrorSvg('Steam API Unavailable', 'Try again later.'),
          };
        default:
          return {
            statusCode: 200,
            headers,
            body: buildErrorSvg('No Data Available', err.message),
          };
      }
    }
    console.error('Unhandled error in card handler:', err);
    return {
      statusCode: 200,
      headers,
      body: buildErrorSvg('Internal Error', 'An unexpected error occurred. Please try again.'),
    };
  }
}
