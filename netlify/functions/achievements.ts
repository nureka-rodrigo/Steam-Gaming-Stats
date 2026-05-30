import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  parseCommonParams,
  buildThemeOverrides,
  isNumericSteamId,
  parseBoolean,
} from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getPlayerAchievements, getSchemaForGame } from '../../src/steam/client';
import {
  buildSvgWrapper,
  buildErrorSvg,
  buildProgressBar,
  buildText,
  buildCircularProgress,
} from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH, HEADER_HEIGHT } from '../../src/svg/layout';
import { truncateText, FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';

const ROW_H = 60;
const MAX_APPIDS = 5;
const ARC_R = 20;
const ARC_CX = CARD_WIDTH - CARD_PADDING - ARC_R - 4;

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

  const appidsRaw = query['appids'];
  if (!appidsRaw) {
    return {
      statusCode: 200,
      headers: buildNoCacheHeaders(),
      body: buildErrorSvg(
        'Missing appids',
        'Provide comma-separated Steam app IDs via ?appids=730,570',
      ),
    };
  }

  const appIds = appidsRaw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
    .slice(0, MAX_APPIDS);

  const showRatio = parseBoolean(query['show_ratio'], true);
  const progressStyle = query['progress_style'] === 'arc' ? 'arc' : 'bar';

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const results = await Promise.all(
      appIds.map(async (appId) => {
        const [achievements, schema] = await Promise.all([
          getPlayerAchievements(steamId, appId).catch(() => null),
          getSchemaForGame(appId).catch(() => ({ gameName: '', achievementCount: 0 })),
        ]);
        const earned = achievements?.filter((a) => a.achieved === 1).length ?? 0;
        const total = schema.achievementCount || achievements?.length || 0;
        const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
        const gameName = schema.gameName || `App ${appId}`;
        return { appId, earned, total, percent, gameName };
      }),
    );

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const cardHeight = HEADER_HEIGHT + CARD_PADDING + results.length * ROW_H + CARD_PADDING;
    const contentWidth =
      CARD_WIDTH - CARD_PADDING * 2 - (progressStyle === 'arc' ? ARC_R * 2 + 16 : 0);

    const rows = results
      .map((r, i) => {
        const y = HEADER_HEIGHT + CARD_PADDING + i * ROW_H;
        const cy = y + ROW_H / 2;
        const label = r.gameName;
        const displayName = truncateText(
          label,
          contentWidth - (showRatio ? 80 : 0),
          FONT_SIZE_BODY,
        );
        const ratioText = showRatio && r.total > 0 ? `${r.earned}/${r.total}` : '';
        const barFill = Math.round(((CARD_WIDTH - CARD_PADDING * 2) * r.percent) / 100);

        if (progressStyle === 'arc') {
          return `<g>
            ${buildText(displayName, CARD_PADDING, y + 18, FONT_SIZE_BODY, theme.text, 'bold')}
            ${showRatio && r.total > 0 ? buildText(ratioText, CARD_PADDING, y + 38, FONT_SIZE_SMALL, theme.statLabel) : ''}
            ${buildCircularProgress(ARC_CX, cy, ARC_R, r.percent, theme.barBackground, theme.bar)}
            ${buildText(`${r.percent}%`, ARC_CX, cy + 5, FONT_SIZE_SMALL, theme.title, 'bold', 'middle')}
          </g>`;
        }

        return `<g>
          ${buildText(displayName, CARD_PADDING, y + 16, FONT_SIZE_BODY, theme.text, 'bold')}
          ${buildText(`${r.percent}%`, CARD_WIDTH - CARD_PADDING, y + 16, FONT_SIZE_SMALL, theme.title, 'bold', 'end')}
          ${buildProgressBar(CARD_PADDING, y + 24, CARD_WIDTH - CARD_PADDING * 2, 8, barFill, theme.bar, theme.barBackground, 4)}
          ${showRatio && r.total > 0 ? buildText(ratioText, CARD_PADDING, y + 46, FONT_SIZE_SMALL, theme.statLabel) : ''}
        </g>`;
      })
      .join('\n');

    const header =
      renderIcon('trophy', CARD_PADDING, 14, 20, theme.icon) +
      buildText(
        'Achievement Showcase',
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
      `Achievement showcase for Steam user ${steamId}`,
    );
  });
};
