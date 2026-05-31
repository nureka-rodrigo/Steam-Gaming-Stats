import type { Handler, HandlerEvent } from '@netlify/functions';
import { parseCommonParams, buildThemeOverrides, isNumericSteamId } from '../../src/utils/params';
import { resolveTheme } from '../../src/svg/themes';
import type { ThemePalette } from '../../src/svg/themes';
import {
  resolveVanityUrl,
  getPlayerSummaries,
  getOwnedGames,
  getRecentlyPlayedGames,
  getPlayerLevel,
  getGameIconUrl,
} from '../../src/steam/client';
import type { PlayerLevelData } from '../../src/steam/client';
import {
  buildSvgWrapper,
  buildErrorSvg,
  buildProgressBar,
  buildText,
} from '../../src/svg/renderer';
import { buildNoCacheHeaders } from '../../src/utils/response';
import { withErrorHandling } from '../../src/utils/handler';
import { formatNumber, formatPlaytime } from '../../src/utils/i18n';
import { renderIcon } from '../../src/svg/icons';
import { CARD_PADDING, CARD_WIDTH, computeBarWidth } from '../../src/svg/layout';
import {
  truncateText,
  FONT_FAMILY,
  FONT_SIZE_BODY,
  FONT_SIZE_SMALL,
} from '../../src/svg/typography';
import { escapeXml } from '../../src/utils/escape';

// ─── Layout constants ────────────────────────────────────────────────────────

const AVATAR_SIZE = 68;
const CONTENT_X = CARD_PADDING + AVATAR_SIZE + 16; // 104

const STATUS_COLORS: Record<number, string> = {
  0: '8b949e',
  1: '57cbde',
  2: '57cbde',
  3: '57cbde',
  4: '57cbde',
  5: '57cbde',
  6: '57cbde',
};
const PERSONA_LABELS: Record<number, string> = {
  0: 'Offline',
  1: 'Online',
  2: 'Busy',
  3: 'Away',
  4: 'Snooze',
  5: 'Looking to Trade',
  6: 'Looking to Play',
};

// Stats row (three equal boxes)
const STAT_GAP = 8;
const STAT_BOX_W = Math.floor((CARD_WIDTH - CARD_PADDING * 2 - STAT_GAP * 2) / 3); // 145
const STAT_BOX_H = 55;
const STAT_Y = 108;

// Dividers
const DIVIDER_1_Y = 98;
const DIVIDER_2_Y = 172;

// Recently played sub-section
const RECENT_ICON_SIZE = 32;
const RECENT_ROW_H = 46;
const RECENT_HEADER_H = 26; // height of the "Recently Played" label row
const RECENT_CONTENT_X = CARD_PADDING + RECENT_ICON_SIZE + 10; // 62
// Width available for name/bar: card to right-edge minus left offset and playtime label space
const RECENT_BAR_W = CARD_WIDTH - RECENT_CONTENT_X - CARD_PADDING - 65; // 348

// Level area (right column of header)
const LEVEL_BAR_W = 147;
const LEVEL_BAR_X = CARD_WIDTH - CARD_PADDING - LEVEL_BAR_W; // 328, aligns with left edge of "Games Played" box

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildCardHeight(recentCount: number): number {
  if (recentCount === 0) return STAT_Y + STAT_BOX_H + 22;
  return DIVIDER_2_Y + RECENT_HEADER_H + recentCount * RECENT_ROW_H + 14;
}

function buildLevelSection(ld: PlayerLevelData, theme: ThemePalette, locale: string): string {
  const xpProgress = ld.xp - ld.xpCurrentLevel;
  const levelSpan = xpProgress + ld.xpToNextLevel;
  const barFillW = levelSpan > 0 ? Math.round((LEVEL_BAR_W * xpProgress) / levelSpan) : 0;
  const xpLabel =
    ld.xpToNextLevel > 0
      ? `${formatNumber(ld.xpToNextLevel, locale)} XP to lv.${ld.level + 1}`
      : 'Max level';

  return (
    buildText(String(ld.level), CARD_WIDTH - CARD_PADDING, 36, 22, theme.title, '800', 'end') +
    buildText('Steam Level', CARD_WIDTH - CARD_PADDING, 51, 9, theme.statLabel, 'normal', 'end') +
    buildProgressBar(LEVEL_BAR_X, 57, LEVEL_BAR_W, 4, barFillW, theme.bar, theme.barBackground, 2) +
    buildText(xpLabel, CARD_WIDTH - CARD_PADDING, 72, 9, theme.statLabel, 'normal', 'end')
  );
}

function divider(y: number, theme: ThemePalette): string {
  return `<line x1="${CARD_PADDING}" y1="${y}" x2="${CARD_WIDTH - CARD_PADDING}" y2="${y}" stroke="#${theme.barBackground}" stroke-width="1"/>`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

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

    const [player, games, recentGames, levelData] = await Promise.all([
      getPlayerSummaries(steamId),
      getOwnedGames(steamId).catch(() => []),
      getRecentlyPlayedGames(steamId, 3).catch(() => []),
      getPlayerLevel(steamId).catch(() => null),
    ]);

    if (player.communityvisibilitystate !== 3) {
      return buildErrorSvg(
        'Profile is Private',
        'Make your Steam profile public to use this card.',
      );
    }

    const theme = resolveTheme(common.theme, buildThemeOverrides(common));
    const { locale } = common;

    const totalGames = games.length;
    const gamesPlayed = games.filter((g) => g.playtime_forever > 0).length;
    const totalHours = Math.floor(games.reduce((s, g) => s + g.playtime_forever, 0) / 60);
    const statusColor = STATUS_COLORS[player.personastate] ?? '8b949e';
    const statusLabel = player.gameextrainfo
      ? `In-Game: ${player.gameextrainfo}`
      : (PERSONA_LABELS[player.personastate] ?? 'Offline');
    const hasLevel = levelData !== null;
    const hasRecent = recentGames.length > 0;

    const cardHeight = buildCardHeight(recentGames.length);

    // ── Section 1: Profile header ──────────────────────────────────────────
    // Name must not overlap the level area; give it full width when level is absent
    const nameMaxWidth = hasLevel
      ? LEVEL_BAR_X - CONTENT_X - 8
      : CARD_WIDTH - CONTENT_X - CARD_PADDING;
    const displayName = truncateText(player.personaname, nameMaxWidth, 15);
    const dotCx = CARD_PADDING + AVATAR_SIZE - 8; // 80
    const dotCy = 16 + AVATAR_SIZE - 8; // 76

    const section1 =
      `<clipPath id="av-ov"><circle cx="${CARD_PADDING + AVATAR_SIZE / 2}" cy="${16 + AVATAR_SIZE / 2}" r="${AVATAR_SIZE / 2}"/></clipPath>` +
      `<image href="${player.avatarmedium}" x="${CARD_PADDING}" y="16" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" clip-path="url(#av-ov)"/>` +
      `<circle cx="${dotCx}" cy="${dotCy}" r="6" fill="#${statusColor}" stroke="#${theme.background}" stroke-width="2"/>` +
      buildText(displayName, CONTENT_X, 36, 15, theme.title, 'bold') +
      buildText(
        escapeXml(statusLabel),
        CONTENT_X,
        54,
        FONT_SIZE_SMALL,
        statusColor === '8b949e' ? theme.statLabel : statusColor,
      ) +
      buildText(
        `${formatNumber(totalGames, locale)} games · ${formatNumber(totalHours, locale)}h total`,
        CONTENT_X,
        72,
        FONT_SIZE_SMALL,
        theme.text,
      ) +
      (hasLevel ? buildLevelSection(levelData!, theme, locale) : '');

    // ── Section 2: Stats row ───────────────────────────────────────────────
    const stats = [
      { label: 'Total Games', value: formatNumber(totalGames, locale) },
      { label: 'Total Hours', value: formatNumber(totalHours, locale) },
      { label: 'Games Played', value: formatNumber(gamesPlayed, locale) },
    ];
    const section2 = stats
      .map((s, i) => {
        const bx = CARD_PADDING + i * (STAT_BOX_W + STAT_GAP);
        const cx = bx + STAT_BOX_W / 2;
        return (
          `<rect x="${bx}" y="${STAT_Y}" width="${STAT_BOX_W}" height="${STAT_BOX_H}" rx="5" fill="#${theme.barBackground}"/>` +
          `<text x="${cx}" y="${STAT_Y + 23}" font-family="${FONT_FAMILY}" font-size="18" font-weight="700" fill="#${theme.title}" text-anchor="middle">${escapeXml(s.value)}</text>` +
          `<text x="${cx}" y="${STAT_Y + 43}" font-family="${FONT_FAMILY}" font-size="10" fill="#${theme.statLabel}" text-anchor="middle">${s.label}</text>`
        );
      })
      .join('');

    // ── Section 3: Recently Played ─────────────────────────────────────────
    let section3 = '';
    if (hasRecent) {
      const maxPlaytime = Math.max(...recentGames.map((g) => g.playtime_2weeks));
      const rowsStart = DIVIDER_2_Y + RECENT_HEADER_H;

      const sectionHeader =
        renderIcon('controller', CARD_PADDING, DIVIDER_2_Y + 4, 16, theme.icon) +
        buildText(
          'Recently Played',
          CARD_PADDING + 20,
          DIVIDER_2_Y + 18,
          FONT_SIZE_BODY,
          theme.icon,
          'bold',
        );

      const rows = recentGames
        .map((game, i) => {
          const ry = rowsStart + i * RECENT_ROW_H;
          const iconUrl = getGameIconUrl(game.appid, game.img_icon_url);
          const displayGameName = truncateText(game.name, RECENT_BAR_W, FONT_SIZE_BODY);
          const barFill = computeBarWidth(game.playtime_2weeks, maxPlaytime, RECENT_BAR_W);
          const playtime = formatPlaytime(game.playtime_2weeks, locale);
          return (
            `<image href="${iconUrl}" x="${CARD_PADDING}" y="${ry + 6}" width="${RECENT_ICON_SIZE}" height="${RECENT_ICON_SIZE}" clip-path="inset(0 round 4px)"/>` +
            buildText(
              displayGameName,
              RECENT_CONTENT_X,
              ry + 20,
              FONT_SIZE_BODY,
              theme.text,
              'bold',
            ) +
            buildProgressBar(
              RECENT_CONTENT_X,
              ry + 28,
              RECENT_BAR_W,
              5,
              barFill,
              theme.bar,
              theme.barBackground,
            ) +
            buildText(
              playtime,
              CARD_WIDTH - CARD_PADDING,
              ry + 20,
              FONT_SIZE_SMALL,
              theme.statLabel,
              'normal',
              'end',
            )
          );
        })
        .join('');

      section3 = divider(DIVIDER_2_Y, theme) + sectionHeader + rows;
    }

    return buildSvgWrapper(
      section1 + divider(DIVIDER_1_Y, theme) + section2 + section3,
      cardHeight,
      {
        theme,
        hideBorder: common.hideBorder,
        hideBg: common.hideBg,
        borderRadius: common.borderRadius,
      },
      `Steam overview for ${player.personaname}`,
    );
  });
};
