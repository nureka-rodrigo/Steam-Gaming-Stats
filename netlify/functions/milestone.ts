import type { Handler, HandlerEvent } from '@netlify/functions';
import { parseCommonParams, buildThemeOverrides, isNumericSteamId } from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import { resolveVanityUrl, getOwnedGames } from '../../src/steam/client';
import {
  buildSvgWrapper,
  buildErrorSvg,
  buildProgressBar,
  buildText,
} from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatNumber } from '../../src/utils/i18n';
import { findCurrentMilestone } from '../../src/utils/milestones';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH } from '../../src/svg/layout';
import { FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';

const CARD_HEIGHT = 125;

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

  const milestoneStyle = query['milestone_style'] === 'numeric' ? 'numeric' : 'fun';

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const games = await getOwnedGames(steamId);
    const theme = resolveTheme(common.theme, buildThemeOverrides(common));

    const totalMinutes = games.reduce((s, g) => s + g.playtime_forever, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const { current, next, progressPercent } = findCurrentMilestone(totalHours);

    const barWidth = Math.round(((CARD_WIDTH - CARD_PADDING * 2) * progressPercent) / 100);
    const milestoneLabel =
      milestoneStyle === 'fun' && current
        ? current.funLabel
        : current
          ? `Milestone reached: ${current.label}`
          : 'Keep playing to reach your first milestone!';
    const nextLabel = next
      ? `Next: ${formatNumber(next.hours, common.locale)} hours`
      : 'All milestones reached!';

    const content =
      renderIcon('flame', CARD_PADDING, 14, 20, theme.icon) +
      buildText(
        'Playtime Milestone',
        CARD_PADDING + 26,
        30,
        FONT_SIZE_BODY + 2,
        theme.title,
        'bold',
      ) +
      buildText(
        `${formatNumber(totalHours, common.locale)} hours played`,
        CARD_PADDING,
        60,
        22,
        theme.title,
        '800',
      ) +
      buildText(milestoneLabel, CARD_PADDING, 80, FONT_SIZE_SMALL, theme.text) +
      buildProgressBar(
        CARD_PADDING,
        90,
        CARD_WIDTH - CARD_PADDING * 2,
        8,
        barWidth,
        theme.bar,
        theme.barBackground,
        4,
      ) +
      buildText(
        nextLabel,
        CARD_WIDTH - CARD_PADDING,
        112,
        FONT_SIZE_SMALL,
        theme.statLabel,
        'normal',
        'end',
      );

    return buildSvgWrapper(
      content,
      CARD_HEIGHT,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Playtime milestone for Steam user ${steamId}: ${formatNumber(totalHours, common.locale)} hours`,
    );
  });
};
