// Date formatting utilities for presentation-layer components.
// Keep parsing & formatting logic centralized here per component guidelines.
// Contract:
// - Input: ISO 8601 string (e.g. '1990-04-10T00:00:00.000Z')
// - Output: 'YYYY-MM-DD'
// - Invalid inputs return empty string to allow graceful UI fallback.

export function formatDateYMD(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
