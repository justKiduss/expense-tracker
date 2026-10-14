// Month navigation for the dashboard, in Addis Ababa time (UTC+3, no daylight saving). Pure functions.

const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000;

const key = (y: number, m: number) => {
  const d = new Date(Date.UTC(y, m, 1)); // lets m = -1 or 12 roll over into the neighbouring year
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

function parseKey(s: string | undefined): { y: number; m: number } | null {
  const match = s?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1 };
}

export interface MonthView {
  key: string;           // "2026-10"
  label: string;         // "October 2026"
  from: Date;            // start of the month, as a real instant
  to: Date;              // start of the next month
  isCurrent: boolean;
  prev: string;
  next: string | null;   // null when this is the current month (no future navigation)
  daysLeft: number | null; // only for the current month
}

/** @param requested the ?month=YYYY-MM value; anything invalid or in the future falls back to this month */
export function monthRange(requested?: string, now = new Date()): MonthView {
  const local = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const curY = local.getUTCFullYear();
  const curM = local.getUTCMonth();

  let { y, m } = parseKey(requested) ?? { y: curY, m: curM };
  if (y > curY || (y === curY && m > curM)) { y = curY; m = curM; }

  const from = new Date(Date.UTC(y, m, 1) - ADDIS_OFFSET_MS);
  const to = new Date(Date.UTC(y, m + 1, 1) - ADDIS_OFFSET_MS);
  const isCurrent = y === curY && m === curM;

  return {
    key: key(y, m),
    label: new Date(Date.UTC(y, m, 1)).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    from,
    to,
    isCurrent,
    prev: key(y, m - 1),
    next: isCurrent ? null : key(y, m + 1),
    daysLeft: isCurrent ? Math.max(1, Math.ceil((to.getTime() - now.getTime()) / 86_400_000)) : null,
  };
}