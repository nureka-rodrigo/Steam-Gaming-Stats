import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  parseCommonParams,
  buildThemeOverrides,
  isNumericSteamId,
  parsePositiveInteger,
  parseBoolean,
} from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getOwnedGames, getGameIconUrl } from '../../src/steam/client';
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

const BAR_MAX_WIDTH = CARD_WIDTH - CARD_PADDING * 2 - 50;
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

  const count = parsePositiveInteger(query['count'], 5, 1, 10);
  const showIcons = parseBoolean(query['show_icons'], true);
  const showRankNumbers = parseBoolean(query['show_rank_numbers'], true);

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const allGames = await getOwnedGames(steamId);
    const topGames = allGames
      .filter((g) => g.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, count);

    if (topGames.length === 0) {
      return buildErrorSvg('No Games Found', 'This library has no played games.');
    }

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const maxPlaytime = topGames[0]?.playtime_forever ?? 1;
    const rankWidth = showRankNumbers ? 24 : 0;
    const iconOffset = showIcons ? ICON_SIZE + 8 : 0;
    const cardHeight = HEADER_HEIGHT + CARD_PADDING + topGames.length * ROW_H + CARD_PADDING;

    const rows = topGames
      .map((game, i) => {
        const y = HEADER_HEIGHT + CARD_PADDING + i * ROW_H;
        const iconUrl =
          showIcons && game.img_icon_url ? getGameIconUrl(game.appid, game.img_icon_url) : null;
        const nameX = CARD_PADDING + rankWidth + iconOffset;
        const nameMaxWidth = BAR_MAX_WIDTH - rankWidth - iconOffset - 70;
        const displayName = truncateText(
          game.name ?? `App ${game.appid}`,
          nameMaxWidth,
          FONT_SIZE_BODY,
        );
        const barFill = computeBarWidth(
          game.playtime_forever,
          maxPlaytime,
          BAR_MAX_WIDTH - rankWidth - iconOffset,
        );
        const playtimeLabel = formatPlaytime(game.playtime_forever, common.locale);

        return `<g>
          ${showRankNumbers ? buildText(`${i + 1}.`, CARD_PADDING, y + 16, FONT_SIZE_SMALL, theme.statLabel) : ''}
          ${iconUrl ? `<image href="${iconUrl}" x="${CARD_PADDING + rankWidth}" y="${y + 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" clip-path="inset(0 round 4px)"/>` : ''}
          ${buildText(displayName, nameX, y + 16, FONT_SIZE_BODY, theme.text, 'bold')}
          ${buildProgressBar(nameX, y + 24, BAR_MAX_WIDTH - rankWidth - iconOffset, 6, barFill, theme.bar, theme.barBackground)}
          ${buildText(playtimeLabel, CARD_WIDTH - CARD_PADDING, y + 16, FONT_SIZE_SMALL, theme.statLabel, 'normal', 'end')}
        </g>`;
      })
      .join('\n');

    const header =
      renderIcon('chart', CARD_PADDING, 14, 20, theme.icon) +
      buildText(
        'Top Games by Playtime',
        CARD_PADDING + 26,
        30,
        FONT_SIZE_BODY + 2,
        theme.title,
        'bold',
      );

    return buildSvgWrapper(
      header + rows,
      cardHeight,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Top games by playtime for Steam user ${steamId}`,
    );
  });
};
