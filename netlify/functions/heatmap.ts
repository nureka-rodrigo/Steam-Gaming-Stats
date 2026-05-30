import type { Handler, HandlerEvent } from '@netlify/functions';
import { parseCommonParams, buildThemeOverrides, isNumericSteamId } from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getRecentlyPlayedGames } from '../../src/steam/client';
import { buildSvgWrapper, buildErrorSvg, buildText } from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatPlaytime } from '../../src/utils/i18n';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH, HEADER_HEIGHT, computeBarWidth } from '../../src/svg/layout';
import { truncateText, FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';

const CARD_HEIGHT = 215;
const BAR_AREA_HEIGHT = CARD_HEIGHT - HEADER_HEIGHT - CARD_PADDING * 2 - 20;
const MAX_BAR_WIDTH = CARD_WIDTH - CARD_PADDING * 2 - 100;

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

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const games = await getRecentlyPlayedGames(steamId, 5);
    if (games.length === 0) {
      return buildErrorSvg(
        'No Recent Activity',
        'This player has no games played in the last 2 weeks.',
      );
    }

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const maxPlaytime = Math.max(...games.map((g) => g.playtime_2weeks));
    const barH = Math.floor((BAR_AREA_HEIGHT - (games.length - 1) * 8) / games.length);

    const bars = games
      .map((game, i) => {
        const y = HEADER_HEIGHT + CARD_PADDING + i * (barH + 8);
        const barWidth = computeBarWidth(game.playtime_2weeks, maxPlaytime, MAX_BAR_WIDTH);
        const nameWidth = 90;
        const displayName = truncateText(game.name, nameWidth, FONT_SIZE_SMALL);
        const playtime = formatPlaytime(game.playtime_2weeks, common.locale);

        return `<g>
          ${buildText(displayName, CARD_PADDING, y + barH / 2 + 4, FONT_SIZE_SMALL, theme.text)}
          <rect x="${CARD_PADDING + nameWidth + 6}" y="${y}" width="${MAX_BAR_WIDTH}" height="${barH}" rx="3" fill="#${theme.barBackground}"/>
          <rect x="${CARD_PADDING + nameWidth + 6}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="#${theme.bar}"/>
          ${buildText(playtime, CARD_WIDTH - CARD_PADDING, y + barH / 2 + 4, FONT_SIZE_SMALL, theme.statLabel, 'normal', 'end')}
        </g>`;
      })
      .join('\n');

    const header =
      renderIcon('flame', CARD_PADDING, 14, 20, theme.icon) +
      buildText(
        'Recent Activity (Last 2 Weeks)',
        CARD_PADDING + 26,
        30,
        FONT_SIZE_BODY + 2,
        theme.title,
        'bold',
      );

    return buildSvgWrapper(
      header + bars,
      CARD_HEIGHT,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Recent gaming activity for Steam user ${steamId}`,
    );
  });
};
