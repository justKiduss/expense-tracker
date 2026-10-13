import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Counts this attempt and says whether it is still within the limit. One atomic statement. */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await db.execute(sql`
    insert into rate_limits (key, count, window_start)
    values (${key}, 1, now())
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
                   then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
                          then now() else rate_limits.window_start end
    returning count
  `);
  const count = Number((rows as unknown as { count: number }[])[0].count);
  return { allowed: count <= limit };
}

export const tooMany = () =>
  Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });