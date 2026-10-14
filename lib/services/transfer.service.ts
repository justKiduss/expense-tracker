import { and, eq, ilike, inArray, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';
import { pairTransfers } from '@/lib/transfers';

const MAX_GAP_MS = 10 * 60 * 1000; // SMS delivery can lag by a few minutes

/**
 * Finds moves of your own money between CBE and telebirr and marks both sides as internal, so they
 * are not counted as an expense and as income. Fees still count as spending.
 *   CBE -> telebirr: a CBE debit and a telebirr credit "from Commercial Bank of Ethiopia"
 *   telebirr -> CBE: a telebirr transfer "to Commercial Bank of Ethiopia" and a CBE credit with no sender name
 * Safe to run repeatedly: rows that were already paired are skipped, and so are rows you have
 * un-ticked by hand (they keep their pair id).
 */
export async function matchInternalTransfers(userId: string) {
  const unpaired = and(eq(transations.userId, userId), isNull(transations.transferPairId));
  const cols = { id: transations.id, amount: transations.amount, at: transations.occurredAt };
  const viaCbe = ilike(transations.counterparty, '%commercial bank of ethiopia%');

  // CBE -> telebirr
  const cbeDebits = await db
    .select(cols)
    .from(transations)
    .where(and(unpaired, eq(transations.institution, 'CBE'), eq(transations.direction, 'out'), eq(transations.kind, 'debit')));
  const walletCredits = await db
    .select(cols)
    .from(transations)
    .where(and(unpaired, eq(transations.institution, 'TELEBIRR'), eq(transations.direction, 'in'), eq(transations.kind, 'transfer_in'), viaCbe));

  // telebirr -> CBE
  const walletDebits = await db
    .select(cols)
    .from(transations)
    .where(and(unpaired, eq(transations.institution, 'TELEBIRR'), eq(transations.direction, 'out'), eq(transations.kind, 'transfer_out'), viaCbe));
  const cbeCredits = await db
    .select(cols)
    .from(transations)
    .where(and(unpaired, eq(transations.institution, 'CBE'), eq(transations.direction, 'in'), eq(transations.kind, 'credit'), isNull(transations.counterparty)));

  const pairs = [
    ...pairTransfers(cbeDebits, walletCredits, MAX_GAP_MS),
    ...pairTransfers(walletDebits, cbeCredits, MAX_GAP_MS),
  ];
  for (const [outId, inId] of pairs) {
    await db
      .update(transations)
      .set({ isInternal: true, transferPairId: randomUUID() })
      .where(and(eq(transations.userId, userId), inArray(transations.id, [outId, inId])));
  }
  return pairs.length;
}