/** Joins class names and skips empty ones: cn('a', isActive && 'b') */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Percent change from last month. null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** "5 min ago", "3 hours ago", "2 days ago" */
export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** true when the date is more than `hours` hours in the past */
export function isOlderThanHours(iso: string, hours: number): boolean {
  return Date.now() - new Date(iso).getTime() > hours * 60 * 60 * 1000;
}

/** "Good morning" / "Good afternoon" / "Good evening" in Addis Ababa time */
export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Addis_Ababa' }).format(new Date()),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}