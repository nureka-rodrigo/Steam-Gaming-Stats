import { themes } from '../svg/themes';
import type { ThemePalette } from '../svg/themes';

export interface CommonParams {
  steamId: string;
  theme: string;
  hideBorder: boolean;
  hideBg: boolean;
  borderRadius: number;
  titleColor: string | undefined;
  textColor: string | undefined;
  iconColor: string | undefined;
  bgColor: string | undefined;
  borderColor: string | undefined;
  locale: string;
  cacheSeconds: number;
}

export function parseSteamId(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{17}$/.test(trimmed) && trimmed.startsWith('7656119')) return trimmed;
  if (/^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)) return trimmed;
  return null;
}

export function isNumericSteamId(steamId: string): boolean {
  return /^\d{17}$/.test(steamId);
}

export function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const lower = value.toLowerCase();
  if (['true', '1', 'yes'].includes(lower)) return true;
  if (['false', '0', 'no'].includes(lower)) return false;
  return defaultValue;
}

export function parsePositiveInteger(
  value: string | undefined,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min || parsed > max) return defaultValue;
  return parsed;
}

export function parseTheme(value: string | undefined): string {
  if (!value) return 'default';
  return value in themes ? value : 'default';
}

export function parseHexColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned : undefined;
}

export function parseCommonParams(query: Record<string, string | undefined>): CommonParams {
  const steamId = parseSteamId(query['steamid']);
  const rawCacheSeconds = parsePositiveInteger(query['cache_seconds'], 3600, 1, 86400);
  return {
    steamId: steamId ?? '',
    theme: parseTheme(query['theme']),
    hideBorder: parseBoolean(query['hide_border'], false),
    hideBg: parseBoolean(query['hide_bg'], false),
    borderRadius: parsePositiveInteger(query['border_radius'], 4, 0, 20),
    titleColor: parseHexColor(query['title_color']),
    textColor: parseHexColor(query['text_color']),
    iconColor: parseHexColor(query['icon_color']),
    bgColor: parseHexColor(query['bg_color']),
    borderColor: parseHexColor(query['border_color']),
    locale: query['locale'] ?? 'en',
    cacheSeconds: Math.max(14400, rawCacheSeconds),
  };
}

export function buildThemeOverrides(params: CommonParams): Partial<ThemePalette> {
  const overrides: Partial<ThemePalette> = {};
  if (params.titleColor !== undefined) overrides.title = params.titleColor;
  if (params.textColor !== undefined) overrides.text = params.textColor;
  if (params.iconColor !== undefined) overrides.icon = params.iconColor;
  if (params.bgColor !== undefined) overrides.background = params.bgColor;
  if (params.borderColor !== undefined) overrides.border = params.borderColor;
  return overrides;
}
