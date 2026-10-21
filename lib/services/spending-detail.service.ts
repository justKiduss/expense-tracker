import { and, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';

export const KIND_LABEL: Record<string, string> = {
  transfer_in: 'Transfer received',
  transfer_out: 'Transfer sent',
  payment: 'Payment',
  debit: 'Debit',
  credit: 'Credit',
  loan_received: 'Loan received',
  loan_repayment: 'Loan repayment',
  manual: 'Manual entry',
};

export type DetailRow = {
  id: string;
  occurredAt: string; // ISO
  title: string;
  kindLabel: string;
  account: string;
  categoryId: string | null;
  amountCents: number;
  feeCents: number;
  countedCents: number; // what this row adds to "Spent"
  feeOnly: boolean; // only its fee counts (own transfer)
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every row that adds to "Spent" in the range. category: 'all' | 'uncategorised' | a category id.
 * Same rule as the totals: out, not internal, not loan_repayment => amount + fee; any other row => fee only.
 */
export async function getSpendingDetail(
  userId: string,
  from: Date,
  to: Date,
  category: string,
): Promise<DetailRow[]> {
  const conditions = [
    eq(transations.userId, userId),
    gte(transations.occurredAt, from),
    lt(transations.occurredAt, to),
  ];
  if (category === 'uncategorised') conditions.push(isNull(transations.categoryId));
  else if (UUID.test(category)) conditions.push(eq(transations.categoryId, category));

  const rows = await db
    .select({
      id: transations.id,
      occurredAt: transations.occurredAt,
      counterparty: transations.counterparty,
      description: transations.description,
      kind: transations.kind,
      direction: transations.direction,
      amount: transations.amount,
      fee: transations.fee,
      isInternal: transations.isInternal,
      institution: transations.institution,
      categoryId: transations.categoryId,
    })
    .from(transations)
    .where(and(...conditions))
    .orderBy(desc(transations.occurredAt))
    .limit(1000);

  const result: DetailRow[] = [];
  for (const r of rows) {
    const fee = r.fee ?? 0;
    const spendsAmount = r.direction === 'out' && !r.isInternal && r.kind !== 'loan_repayment';
    const counted = spendsAmount ? r.amount + fee : fee;
    if (counted <= 0) continue;
    result.push({
      id: r.id,
      occurredAt: r.occurredAt.toISOString(),
      title: r.counterparty ?? r.description ?? KIND_LABEL[r.kind] ?? r.kind,
      kindLabel: KIND_LABEL[r.kind] ?? r.kind,
      account: r.institution === 'TELEBIRR' ? 'telebirr' : r.institution === 'CBE' ? 'CBE' : '-',
      categoryId: r.categoryId,
      amountCents: r.amount,
      feeCents: fee,
      countedCents: counted,
      feeOnly: !spendsAmount,
    });
  }
  return result;
}