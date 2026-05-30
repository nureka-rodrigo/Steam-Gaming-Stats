export const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const FONT_SIZE_BODY = 13;
export const FONT_SIZE_SMALL = 11;

// Approximate character width ratio for proportional fonts
const AVG_CHAR_WIDTH_RATIO = 0.55;

export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * AVG_CHAR_WIDTH_RATIO;
}

export function truncateText(text: string, maxWidth: number, fontSize: number): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && estimateTextWidth(truncated + '…', fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}
