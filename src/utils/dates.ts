const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86_400_000;

const pad = (n: number): string => String(n).padStart(2, '0');

// Calendar dates are handled as UTC midnights so daylight saving can't shift the day.
const parseIsoDate = (iso: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
};

export const isIsoDate = (iso: string): boolean => parseIsoDate(iso) !== null;

/** Today in the browser's time zone, not UTC (which is still yesterday in an Australian morning). */
export const todayIso = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** Adds days to a YYYY-MM-DD date; '' when the date is missing or invalid. */
export const addDays = (iso: string, days: number): string => {
  const date = parseIsoDate(iso);
  if (!date) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Whole days from one YYYY-MM-DD date to another; null if either is invalid. */
export const daysBetween = (from: string, to: string): number | null => {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  return a && b ? Math.round((b.getTime() - a.getTime()) / DAY_MS) : null;
};

/** "2026-11-08" -> "8 Nov 2026"; anything unparseable is returned as-is. */
export const formatHumanDate = (iso: string): string => {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};
