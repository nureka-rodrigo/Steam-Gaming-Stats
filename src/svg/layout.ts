export const CARD_WIDTH = 495;
export const CARD_PADDING = 20;
export const HEADER_HEIGHT = 50;

export function computeBarWidth(value: number, max: number, maxWidth: number): number {
  if (max === 0) return 0;
  return Math.round((value / max) * maxWidth);
}
