import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  parseCommonParams,
  buildThemeOverrides,
  isNumericSteamId,
  parseBoolean,
} from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import {
  resolveVanityUrl,
  getPlayerSummaries,
  getOwnedGames,
  getRecentlyPlayedGames,
} from '../../src/steam/client';
import { buildSvgWrapper, buildErrorSvg, buildText } from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatNumber, formatPlaytime } from '../../src/utils/i18n';
import { CARD_PADDING, CARD_WIDTH } from '../../src/svg/layout';
import { FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_SMALL } from '../../src/svg/typography';
import { escapeXml } from '../../src/utils/escape';

const CARD_HEIGHT = 145;
const AVATAR_SIZE = 60;
const STATUS_COLORS: Record<number, string> = {
  0: '8b949e',
  1: '57cbde',
  2: '57cbde',
  3: '57cbde',
  4: '57cbde',
  5: '57cbde',
  6: '57cbde',
};

const PERSONA_STATE_LABELS: Record<number, string> = {
  0: 'Offline',
  1: 'Online',
  2: 'Busy',
  3: 'Away',
  4: 'Snooze',
  5: 'Looking to Trade',
  6: 'Looking to Play',
};

function personaStateLabel(state: number, inGame?: string): string {
  if (inGame) return `In-Game: ${inGame}`;
  return PERSONA_STATE_LABELS[state] ?? 'Offline';
}

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

  const showAvatar = parseBoolean(query['show_avatar'], true);
  const showStatus = parseBoolean(query['show_status'], true);
  const showCurrentlyPlaying = parseBoolean(query['show_currently_playing'], true);

  return withErrorHandling(event, common.cacheSeconds, async () => {
    let steamId = common.steamId;
    if (!isNumericSteamId(steamId)) steamId = await resolveVanityUrl(steamId);

    const [player, games, recentGames] = await Promise.all([
      getPlayerSummaries(steamId),
      getOwnedGames(steamId).catch(() => []),
      getRecentlyPlayedGames(steamId, 1).catch(() => []),
    ]);

    if (player.communityvisibilitystate !== 3) {
      return buildErrorSvg(
        'Profile is Private',
        'Make your Steam profile public to use this card.',
      );
    }

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const totalHours = Math.floor(games.reduce((s, g) => s + g.playtime_forever, 0) / 60);
    const statusColor = STATUS_COLORS[player.personastate] ?? 'gray';
    const statusLabel = showCurrentlyPlaying
      ? personaStateLabel(player.personastate, player.gameextrainfo)
      : personaStateLabel(player.personastate);
    const recentGame = recentGames[0];

    const leftColW = showAvatar ? AVATAR_SIZE + 16 : 0;
    const rightX = CARD_PADDING + leftColW;

    const avatarSection = showAvatar
      ? `<clipPath id="av"><circle cx="${CARD_PADDING + AVATAR_SIZE / 2}" cy="${CARD_HEIGHT / 2}" r="${AVATAR_SIZE / 2}"/></clipPath>
         <image href="${player.avatarmedium}" x="${CARD_PADDING}" y="${(CARD_HEIGHT - AVATAR_SIZE) / 2}" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" clip-path="url(#av)"/>
         ${showStatus ? `<circle cx="${CARD_PADDING + AVATAR_SIZE - 8}" cy="${CARD_HEIGHT / 2 + AVATAR_SIZE / 2 - 8}" r="6" fill="#${statusColor}" stroke="#${theme.background}" stroke-width="2"/>` : ''}`
      : '';

    const infoSection = [
      buildText(escapeXml(player.personaname), rightX, 38, FONT_SIZE_BODY + 4, theme.title, 'bold'),
      showStatus
        ? buildText(
            statusLabel,
            rightX,
            58,
            FONT_SIZE_SMALL,
            statusColor === 'gray' ? theme.statLabel : statusColor,
          )
        : '',
      buildText(
        `${formatNumber(games.length, common.locale)} games`,
        rightX,
        80,
        FONT_SIZE_SMALL,
        theme.text,
      ),
      buildText(
        `${formatNumber(totalHours, common.locale)} total hours`,
        rightX,
        98,
        FONT_SIZE_SMALL,
        theme.text,
      ),
      recentGame && showCurrentlyPlaying
        ? buildText(
            `Recent: ${escapeXml(recentGame.name)} (${formatPlaytime(recentGame.playtime_2weeks, common.locale)})`,
            rightX,
            116,
            FONT_SIZE_SMALL,
            theme.statLabel,
          )
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const header = `<text x="${CARD_WIDTH - CARD_PADDING}" y="20" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE_SMALL}" fill="#${theme.statLabel}" text-anchor="end">Steam Profile</text>`;

    return buildSvgWrapper(
      header + avatarSection + infoSection,
      CARD_HEIGHT,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Steam profile overview for ${player.personaname}`,
    );
  });
};
