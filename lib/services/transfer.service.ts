import { and, eq, ilike, inArray, isNull,gte,lt,desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';
import { pairTransfers } from '@/lib/transfers';

const MAX_GAP_MS = 10 * 60 * 1000; // SMS delivery can lag by a few minutes

/**
 * Finds CBE -> telebirr moves of your own money and marks both sides as internal, so they are
 * not counted as an expense and as income. The CBE service fee still counts as spending.
 * Safe to run repeatedly: rows that were already paired are skipped, and so are rows you
 * have un-ticked by hand (they keep their pair id).
 */
export async function matchInternalTransfers(userId: string) {
  const unpaired = and(eq(transations.userId, userId), isNull(transations.transferPairId));
  const cols = { id: transations.id, amount: transations.amount, at: transations.occurredAt };

  const debits = await db
    .select(cols)
    .from(transations)
    .where(and(unpaired, eq(transations.institution, 'CBE'), eq(transations.direction, 'out'), eq(transations.kind, 'debit')));

  const credits = await db
    .select(cols)
    .from(transations)
    .where(
      and(
        unpaired,
        eq(transations.institution, 'TELEBIRR'),
        eq(transations.direction, 'in'),
        eq(transations.kind, 'transfer_in'),
        ilike(transations.counterparty, '%commercial bank of ethiopia%'),
      ),
    );

  const pairs = pairTransfers(debits, credits, MAX_GAP_MS);
  for (const [debitId, creditId] of pairs) {
    await db
      .update(transations)
      .set({ isInternal: true, transferPairId: randomUUID() })
      .where(and(eq(transations.userId, userId), inArray(transations.id, [debitId, creditId])));
  }
  return pairs.length;
}

export async function listTransactions(userId: string, range: { from: Date; to: Date }, limit = 300) {
  return db
    .select()
    .from(transations)
    .where(and(eq(transations.userId, userId), gte(transations.occurredAt, range.from), lt(transations.occurredAt, range.to)))
    .orderBy(desc(transations.occurredAt))
    .limit(limit);
}