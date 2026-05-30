# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

---

## [Unreleased]

> Changes staged for the next release.

---

## [1.0.0] - 2026-05-30

### Added

#### Netlify Function Handlers

- `recently-played` — renders recently played games with relative playtime bars and game icons
- `top-games` — renders all-time top games ranked by total hours with optional rank numbers
- `library` — renders a 2x2 stat grid (total games, games played, total hours, top game)
- `achievements` — renders achievement completion for up to 5 games; supports `bar` and `arc` progress styles
- `profile` — renders player avatar (circular crop), online status, total hours, and recently played game
- `heatmap` — renders a horizontal bar chart of 2-week playtime per game (Recent Activity)
- `milestone` — renders total hours with humorous or numeric milestone labels and a progress bar

#### Steam API Client (`src/steam/client.ts`)

- `resolveVanityUrl` — converts vanity URL usernames to SteamID64
- `getPlayerSummaries` — fetches display name, avatar, online status, and in-game state
- `getRecentlyPlayedGames` — fetches games played in the last 2 weeks
- `getOwnedGames` — fetches full library with playtime, optionally including free-to-play games
- `getPlayerAchievements` — fetches per-game achievement completion for a player
- `getSchemaForGame` — fetches the total achievement count defined for a game
- `SteamError` typed error class with codes: `network`, `private`, `not_found`, `no_data`, `api_error`
- 5-second `AbortController` timeout on all outbound Steam API requests

#### SVG Rendering Engine (`src/svg/`)

- `renderer.ts` — `buildSvgWrapper`, `buildErrorSvg`, `buildProgressBar`, `buildText`, `buildCircularProgress`
- `themes.ts` — 12 built-in themes: `default`, `dark`, `radical`, `merko`, `gruvbox`, `tokyonight`, `onedark`, `cobalt`, `synthwave`, `highcontrast`, `dracula`, `steam`
- `themes.ts` — `resolveTheme` with per-parameter color overrides applied after theme resolution
- `layout.ts` — `computeCardHeight`, `computeRowY`, `computeBarWidth`, `computeProgressArcPath`; card width constant (495px)
- `icons.ts` — SVG path data for `controller`, `steam`, `trophy`, `clock`, `book`, `flame`, `chart`, `star` with `renderIcon` helper
- `typography.ts` — font-family constant, font-size constants, `truncateText` with ellipsis, `estimateTextWidth`

#### Shared Utilities (`src/utils/`)

- `params.ts` — `parseCommonParams`, `parseSteamId`, `parseBoolean`, `parsePositiveInteger`, `parseTheme`, `parseHexColor`, `buildThemeOverrides`; `cache_seconds` clamped to minimum 14400
- `escape.ts` — `escapeXml` sanitizes all user-supplied strings before SVG interpolation (prevents SVG injection)
- `handler.ts` — `withErrorHandling` wrapper: IP rate limiting, typed Steam error handling, no-cache headers on error responses
- `ratelimit.ts` — in-memory per-IP rate limiter (60 requests/minute); resets per Lambda instance
- `response.ts` — `buildCacheHeaders` (`s-maxage` + `stale-while-revalidate`) and `buildNoCacheHeaders`
- `i18n.ts` — `getStrings`, `formatPlaytime` (hours/minutes), `formatNumber` (locale-aware via `Intl.NumberFormat`)
- `milestones.ts` — 9 playtime milestones with fun and numeric labels; `findCurrentMilestone` with progress percentage

#### Configuration

- `netlify.toml` — wildcard redirect `/api/*` to `/.netlify/functions/:splat`; `NODE_VERSION=20`; `X-Frame-Options`, `X-Content-Type-Options`, and `Content-Security-Policy` headers
- `tsconfig.json` — strict TypeScript configuration: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `isolatedModules`; includes both `src/` and `netlify/functions/`
- `.gitignore` — covers `node_modules`, `dist`, `.env`, `.netlify`

#### Landing Page (`public/`)

- `index.html` — full Tailwind CSS (Play CDN) rewrite with custom color palette (`canvas`/`fg` token system)
- Hero section, URL builder with live card preview, themes showcase, parameter reference table, FAQ accordion
- Live preview fetches SVG as text and injects it inline — resolves the `<img>` external-image sandboxing issue so Steam avatars and game icons render correctly
- URL builder debounces Steam ID input (700ms); selects and checkboxes reload preview immediately
- Custom-styled text input (Steam icon prefix, hover/focus ring), `appearance-none` selects with SVG chevron, peer-based custom checkboxes
- Copy buttons with "Copied!" confirmation state
- FAQ accordion limited to one open item at a time
- Responsive: two-column builder collapses to single column below 768px; preview panel is `position: sticky`

---

[Unreleased]: https://github.com/Nureka-Rodrigo/Steam-Gaming-Stats/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Nureka-Rodrigo/Steam-Gaming-Stats/compare/v0.1.0...v1.0.0
