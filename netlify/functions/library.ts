import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  parseCommonParams,
  buildThemeOverrides,
  isNumericSteamId,
  parseBoolean,
} from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getOwnedGames } from '../../src/steam/client';
import { buildSvgWrapper, buildErrorSvg, buildText } from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatNumber } from '../../src/utils/i18n';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH } from '../../src/svg/layout';
import { FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';

const CARD_HEIGHT = 205;
const STAT_BOX_W = (CARD_WIDTH - CARD_PADDING * 2 - 10) / 2;
const STAT_BOX_H = 60;

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

  const showFreeGames = parseBoolean(query['show_free_games'], true);
  const highlightTopGame = parseBoolean(query['highlight_top_game'], true);

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const games = await getOwnedGames(steamId, showFreeGames);
    const theme = resolveTheme(common.theme, buildThemeOverrides(common));

    const totalGames = games.length;
    const gamesPlayed = games.filter((g) => g.playtime_forever > 0).length;
    const totalMinutes = games.reduce((sum, g) => sum + g.playtime_forever, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const topGame = highlightTopGame
      ? (games.sort((a, b) => b.playtime_forever - a.playtime_forever)[0] ?? null)
      : null;

    const statBoxes = [
      { label: 'Total Games', value: formatNumber(totalGames, common.locale) },
      { label: 'Games Played', value: formatNumber(gamesPlayed, common.locale) },
      { label: 'Total Hours', value: formatNumber(totalHours, common.locale) },
      {
        label: 'Top Game',
        value: topGame ? (topGame.name ?? `App ${topGame.appid}`).slice(0, 18) : '—',
      },
    ];

    const boxes = statBoxes
      .map((box, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = CARD_PADDING + col * (STAT_BOX_W + 10);
        const y = 55 + row * (STAT_BOX_H + 10);
        return `<g>
          <rect x="${x}" y="${y}" width="${STAT_BOX_W}" height="${STAT_BOX_H}" rx="6" fill="#${theme.barBackground}"/>
          <text x="${x + STAT_BOX_W / 2}" y="${y + 24}" font-family="${FONT_FAMILY}" font-size="18" font-weight="700" fill="#${theme.title}" text-anchor="middle">${box.value}</text>
          <text x="${x + STAT_BOX_W / 2}" y="${y + 44}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE_SMALL}" fill="#${theme.statLabel}" text-anchor="middle">${box.label}</text>
        </g>`;
      })
      .join('\n');

    const header =
      renderIcon('book', CARD_PADDING, 14, 20, theme.icon) +
      buildText(
        'Game Library Overview',
        CARD_PADDING + 26,
        30,
        FONT_SIZE_BODY + 2,
        theme.title,
        'bold',
      );

    return buildSvgWrapper(
      header + boxes,
      CARD_HEIGHT,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Game library overview for Steam user ${steamId}`,
    );
  });
};
