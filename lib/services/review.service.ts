import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format-currency';

export type ReviewGroup = {
  key: string;
  sampleId: string; // one transaction of the group, used to save the rule
  label: string;
  hint: string | null;
  remember: 'counterparty' | 'amount';
  count: number;
  totalCents: number;
  lastAt: string; // ISO
};

/** Uncategorised spending (all months), grouped by person paid, or by amount when there is no name. */
export async function getReviewGroups(userId: string, limit = 40): Promise<ReviewGroup[]> {
  const amountKey = sql<number | null>`case when ${transations.counterparty} is null then ${transations.amount} end`;
  const totalSql = sql`sum(${transations.amount} + coalesce(${transations.fee}, 0))`;

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
    .where(
      and(
        eq(transations.userId, userId),
        isNull(transations.categoryId),
        eq(transations.direction, 'out'),
        eq(transations.isInternal, false),
        ne(transations.kind, 'loan_repayment'),
      ),
    )
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