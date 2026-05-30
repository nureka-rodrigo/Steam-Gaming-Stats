import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  parseCommonParams,
  buildThemeOverrides,
  isNumericSteamId,
  parsePositiveInteger,
  parseBoolean,
} from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getRecentlyPlayedGames, getGameIconUrl } from '../../src/steam/client';
import {
  buildSvgWrapper,
  buildErrorSvg,
  buildProgressBar,
  buildText,
} from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatPlaytime } from '../../src/utils/i18n';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH, HEADER_HEIGHT, computeBarWidth } from '../../src/svg/layout';
import { truncateText, FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';

const BAR_MAX_WIDTH = CARD_WIDTH - CARD_PADDING * 2 - 60;
const ROW_H = 52;
const ICON_SIZE = 32;

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

  const count = parsePositiveInteger(query['count'], 5, 1, 5);
  const showPlaytime = parseBoolean(query['show_playtime'], true);
  const showIcons = parseBoolean(query['show_icons'], true);

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const games = await getRecentlyPlayedGames(steamId, count);
    if (games.length === 0) {
      return buildErrorSvg(
        'No Recent Activity',
        'This player has no games played in the last 2 weeks.',
      );
    }

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const maxPlaytime = Math.max(...games.map((g) => g.playtime_2weeks));
    const cardHeight = HEADER_HEIGHT + CARD_PADDING + games.length * ROW_H + CARD_PADDING;

    const rows = games
      .map((game, i) => {
        const y = HEADER_HEIGHT + CARD_PADDING + i * ROW_H;
        const iconUrl = showIcons ? getGameIconUrl(game.appid, game.img_icon_url) : null;
        const nameX = CARD_PADDING + (showIcons ? ICON_SIZE + 10 : 0);
        const nameMaxWidth =
          BAR_MAX_WIDTH - (showIcons ? ICON_SIZE + 10 : 0) - (showPlaytime ? 70 : 0);
        const displayName = truncateText(game.name, nameMaxWidth, FONT_SIZE_BODY);
        const barFill = computeBarWidth(game.playtime_2weeks, maxPlaytime, BAR_MAX_WIDTH);
        const playtimeLabel = formatPlaytime(game.playtime_2weeks, common.locale);

        return `<g>
          ${iconUrl ? `<image href="${iconUrl}" x="${CARD_PADDING}" y="${y + 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" clip-path="inset(0 round 4px)"/>` : ''}
          ${buildText(displayName, nameX, y + 16, FONT_SIZE_BODY, theme.text, 'bold')}
          ${buildProgressBar(nameX, y + 24, BAR_MAX_WIDTH - (showIcons ? ICON_SIZE + 10 : 0), 6, barFill, theme.bar, theme.barBackground)}
          ${showPlaytime ? buildText(playtimeLabel, CARD_WIDTH - CARD_PADDING, y + 16, FONT_SIZE_SMALL, theme.statLabel, 'normal', 'end') : ''}
        </g>`;
      })
      .join('\n');

    const header =
      renderIcon('controller', CARD_PADDING, 14, 20, theme.icon) +
      buildText('Recently Played', CARD_PADDING + 26, 30, FONT_SIZE_BODY + 2, theme.title, 'bold');

    return buildSvgWrapper(
      header + rows,
      cardHeight,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Recently played games for Steam user ${steamId}`,
    );
  });
};
