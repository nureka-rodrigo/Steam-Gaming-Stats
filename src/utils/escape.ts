const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}
