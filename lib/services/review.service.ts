import { and, desc, eq, gte, isNull, lt, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format-currency';

const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3
const DAY_MS = 86_400_000;

export type ReviewGroup = {
  key: string;
  sampleId: string;
  label: string;
  hint: string | null;
  remember: 'counterparty' | 'amount';
  count: number;
  totalCents: number;
  lastAt: string; // ISO
};

export type ReviewRange = {
  from: Date | null;
  to: Date | null;
  month: string | null; // 'YYYY-MM' or null
  day: string | null; // 'YYYY-MM-DD' or null
  all: boolean;
};

/** ?month=YYYY-MM | all, ?day=YYYY-MM-DD  ->  a date range in Addis Ababa time. Default: this month. */
export function resolveReviewRange(month?: string, day?: string): ReviewRange {
  const dayMatch = day ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  if (dayMatch) {
    const start = Date.UTC(Number(dayMatch[1]), Number(dayMatch[2]) - 1, Number(dayMatch[3])) - ADDIS_OFFSET_MS;
    return { from: new Date(start), to: new Date(start + DAY_MS), month: null, day: day as string, all: false };
  }

  if (month === 'all') return { from: null, to: null, month: null, day: null, all: true };

  const local = new Date(Date.now() + ADDIS_OFFSET_MS);
  let y = local.getUTCFullYear();
  let m = local.getUTCMonth();
  const monthMatch = month ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month) : null;
  if (monthMatch) {
    y = Number(monthMatch[1]);
    m = Number(monthMatch[2]) - 1;
  }
  return {
    from: new Date(Date.UTC(y, m, 1) - ADDIS_OFFSET_MS),
    to: new Date(Date.UTC(y, m + 1, 1) - ADDIS_OFFSET_MS),
    month: `${y}-${String(m + 1).padStart(2, '0')}`,
    day: null,
    all: false,
  };
}

/** Uncategorised spending in the range, grouped by person paid, or by amount when there is no name. */
export async function getReviewGroups(userId: string, range: ReviewRange, limit = 40): Promise<ReviewGroup[]> {
  const amountKey = sql<number | null>`case when ${transations.counterparty} is null then ${transations.amount} end`;
  const totalSql = sql`sum(${transations.amount} + coalesce(${transations.fee}, 0))`;

  const conditions = [
    eq(transations.userId, userId),
    isNull(transations.categoryId),
    eq(transations.direction, 'out'),
    eq(transations.isInternal, false),
    ne(transations.kind, 'loan_repayment'),
  ];
  if (range.from) conditions.push(gte(transations.occurredAt, range.from));
  if (range.to) conditions.push(lt(transations.occurredAt, range.to));

  const rows = await db
    .select({
      counterparty: transations.counterparty,
      amountKey,
      sampleId: sql<string>`(array_agg(${transations.id} order by ${transations.occurredAt} desc))[1]`,
      hint: sql<string | null>`max(${transations.description})`,
      count: sql<number>`count(*)`.mapWith(Number),
      total: sql<number>`sum(${transations.amount} + coalesce(${transations.fee}, 0))`.mapWith(Number),
      lastAt: sql<Date | string>`max(${transations.occurredAt})`,
    })
    .from(transations)
    .where(and(...conditions))
    .groupBy(transations.counterparty, amountKey)
    .orderBy(desc(totalSql))
    .limit(limit);

  return rows.map((r) => {
    const byName = r.counterparty !== null;
    return {
      key: byName ? `c:${r.counterparty}` : `a:${r.amountKey}`,
      sampleId: r.sampleId,
      label: byName ? (r.counterparty as string) : `Payments of ${formatCurrency(r.amountKey ?? 0)}`,
      hint: byName ? r.hint : null,
      remember: byName ? 'counterparty' : 'amount',
      count: r.count,
      totalCents: r.total,
      lastAt: new Date(r.lastAt).toISOString(),
    } satisfies ReviewGroup;
  });
}