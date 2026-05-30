import { CARD_WIDTH, CARD_PADDING } from './layout';
import { FONT_FAMILY } from './typography';
import { escapeXml } from '../utils/escape';
import type { ThemePalette } from './themes';

export interface CardOptions {
  theme: ThemePalette;
  hideBorder: boolean;
  hideBg: boolean;
  borderRadius: number;
  width?: number;
}

export function buildSvgWrapper(
  content: string,
  height: number,
  options: CardOptions,
  titleText: string,
): string {
  const width = options.width ?? CARD_WIDTH;
  const { theme, hideBorder, hideBg, borderRadius } = options;
  const bgFill = hideBg ? 'none' : `#${theme.background}`;
  const borderStroke = hideBorder ? 'none' : `#${theme.border}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(titleText)}">
  <title>${escapeXml(titleText)}</title>
  <defs>
    <style>text { font-family: ${FONT_FAMILY},serif; }</style>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${bgFill}" stroke="${borderStroke}"/>
  ${content}
</svg>`;
}

export function buildErrorSvg(message: string, detail: string, width = CARD_WIDTH): string {
  const height = 120;
  const p = CARD_PADDING;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Error: ${escapeXml(message)}">
  <title>Error: ${escapeXml(message)}</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4" fill="#fff9f9" stroke="#fc6d6d"/>
  <text x="${p}" y="45" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" fill="#e53e3e">${escapeXml(message)}</text>
  <text x="${p}" y="70" font-family="${FONT_FAMILY}" font-size="12" fill="#718096">${escapeXml(detail)}</text>
</svg>`;
}

export function buildProgressBar(
  x: number,
  y: number,
  width: number,
  height: number,
  fillWidth: number,
  barColor: string,
  bgColor: string,
  radius = 3,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#${bgColor}"/>
  <rect x="${x}" y="${y}" width="${Math.max(0, fillWidth)}" height="${height}" rx="${radius}" fill="#${barColor}"/>`;
}

export function buildText(
  content: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  fontWeight: string | number = 'normal',
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${fontSize}" font-weight="${fontWeight}" fill="#${color}" text-anchor="${anchor}">${escapeXml(content)}</text>`;
}

export function buildCircularProgress(
  cx: number,
  cy: number,
  r: number,
  percent: number,
  trackColor: string,
  fillColor: string,
  strokeWidth = 4,
): string {
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#${trackColor}" stroke-width="${strokeWidth}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#${fillColor}" stroke-width="${strokeWidth}"
    stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"
    stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>`;
}
