import type { Handler, HandlerEvent } from '@netlify/functions';
import { parseCommonParams, buildThemeOverrides, isNumericSteamId } from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getPlayerLevel } from '../../src/steam/client';
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
import { CARD_PADDING, CARD_WIDTH } from '../../src/svg/layout';
import { FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';

const CARD_HEIGHT = 115;

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

    const { level, xp, xpToNextLevel, xpCurrentLevel } = await getPlayerLevel(steamId);
    const theme = resolveTheme(common.theme, buildThemeOverrides(common));

    const xpProgress = xp - xpCurrentLevel;
    const levelSpan = xpProgress + xpToNextLevel;
    const barFillWidth =
      levelSpan > 0 ? Math.round(((CARD_WIDTH - CARD_PADDING * 2) * xpProgress) / levelSpan) : 0;

    const header =
      renderIcon('star', CARD_PADDING, 14, 20, theme.icon) +
      buildText('Steam Level', CARD_PADDING + 26, 30, FONT_SIZE_BODY + 2, theme.title, 'bold');

    const content =
      buildText(String(level), CARD_PADDING, 62, 26, theme.title, '800') +
      buildProgressBar(
        CARD_PADDING,
        72,
        CARD_WIDTH - CARD_PADDING * 2,
        8,
        barFillWidth,
        theme.bar,
        theme.barBackground,
        4,
      ) +
      buildText(
        `${formatNumber(xpProgress, common.locale)} XP`,
        CARD_PADDING,
        94,
        FONT_SIZE_SMALL,
        theme.text,
      ) +
      buildText(
        xpToNextLevel > 0
          ? `${formatNumber(xpToNextLevel, common.locale)} XP to level ${level + 1}`
          : 'Max level reached',
        CARD_WIDTH - CARD_PADDING,
        94,
        FONT_SIZE_SMALL,
        theme.statLabel,
        'normal',
        'end',
      );

    return buildSvgWrapper(
      header + content,
      CARD_HEIGHT,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Steam level for user ${steamId}: level ${level}`,
    );
  });
};
