import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  parseCommonParams,
  buildThemeOverrides,
  isNumericSteamId,
  parsePositiveInteger,
} from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getUserGameStats } from '../../src/steam/client';
import {
  buildSvgWrapper,
  buildErrorSvg,
  buildProgressBar,
  buildText,
} from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatNumber } from '../../src/utils/i18n';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH, HEADER_HEIGHT, computeBarWidth } from '../../src/svg/layout';
import { truncateText, FONT_SIZE_BODY } from '../../src/svg/typography';

const BAR_MAX_WIDTH = CARD_WIDTH - CARD_PADDING * 2;
const ROW_H = 46;

export const handler: Handler = async (event: HandlerEvent) => {
  const query = (event.queryStringParameters ?? {}) as Record<string, string | undefined>;
  const common = parseCommonParams(query);

  if (!common.steamId) {
    return {
      statusCode: 200,
      headers: buildNoCacheHeaders(),
      body: buildErrorSvg('Missing steamid', 'The steamid parameter is required.'),
    };
  }

  const appIdRaw = query['appid'];
  if (!appIdRaw) {
    return {
      statusCode: 200,
      headers: buildNoCacheHeaders(),
      body: buildErrorSvg('Missing appid', 'Provide a Steam App ID via ?appid=730'),
    };
  }

  const appId = parseInt(appIdRaw, 10);
  if (isNaN(appId)) {
    return {
      statusCode: 200,
      headers: buildNoCacheHeaders(),
      body: buildErrorSvg('Invalid appid', 'The appid must be a numeric Steam App ID.'),
    };
  }

  const count = parsePositiveInteger(query['count'], 5, 1, 10);
  const statsFilter = query['stats']
    ? new Set(
        query['stats']
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : null;

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const { gameName, stats } = await getUserGameStats(steamId, appId);

    const displayed = statsFilter
      ? stats.filter((s) => statsFilter.has(s.name))
      : stats
          .filter((s) => s.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, count);

    if (displayed.length === 0) {
      return buildErrorSvg('No Stats Available', 'This game has no public stats for this player.');
    }

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const maxValue = Math.max(...displayed.map((s) => s.value));
    const cardHeight = HEADER_HEIGHT + CARD_PADDING + displayed.length * ROW_H + CARD_PADDING;
    const gameNameLabel = truncateText(
      gameName,
      CARD_WIDTH - CARD_PADDING * 2 - 26,
      FONT_SIZE_BODY + 2,
    );

    const rows = displayed
      .map((stat, i) => {
        const y = HEADER_HEIGHT + CARD_PADDING + i * ROW_H;
        const barFill = computeBarWidth(stat.value, maxValue, BAR_MAX_WIDTH);
        const displayName = truncateText(stat.displayName, BAR_MAX_WIDTH * 0.65, FONT_SIZE_BODY);
        return `<g>
          ${buildText(displayName, CARD_PADDING, y + 14, FONT_SIZE_BODY, theme.text, 'bold')}
          ${buildText(formatNumber(stat.value, common.locale), CARD_WIDTH - CARD_PADDING, y + 14, FONT_SIZE_BODY, theme.title, '600', 'end')}
          ${buildProgressBar(CARD_PADDING, y + 22, BAR_MAX_WIDTH, 6, barFill, theme.bar, theme.barBackground)}
        </g>`;
      })
      .join('\n');

    const header =
      renderIcon('chart', CARD_PADDING, 14, 20, theme.icon) +
      buildText(gameNameLabel, CARD_PADDING + 26, 30, FONT_SIZE_BODY + 2, theme.title, 'bold');

    return buildSvgWrapper(
      header + rows,
      cardHeight,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Game stats for ${gameName} — Steam user ${steamId}`,
    );
  });
};
