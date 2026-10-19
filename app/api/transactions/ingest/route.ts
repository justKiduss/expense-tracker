import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUser } from '@/lib/auth/request-user';
import { importBatch } from '@/lib/services/transaction.service';
import { matchInternalTransfers } from '@/lib/services/transfer.service';
import { applyCategoryRules } from '@/lib/services/category-rules.service';

// A batch is one database statement now, but allow room for a slow connection (up to what your plan permits).
export const maxDuration = 60;

const money = z.number().int().min(0).max(100_000_000_000);

const item = z.object({
  institution: z.enum(['CBE', 'TELEBIRR']),
  kind: z.enum(['transfer_in', 'transfer_out', 'payment', 'debit', 'credit', 'loan_received', 'loan_repayment']),
  direction: z.enum(['in', 'out']),
  amount: money,
  fee: money,
  currency: z.literal('ETB'),
  balanceAfter: z.number().int().nullable(),
  counterparty: z.string().max(200).nullable(),
  description: z.string().max(300).nullable(),
  reference: z.string().max(100).nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
  dateSource: z.enum(['sms_body', 'received_at']),
  dedupeKey: z.string().min(1).max(200),
  needsReview: z.boolean(),
});

const schema = z.object({ transactions: z.array(item).min(1).max(50) });

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  // One statement for the whole batch. Rows that already exist are skipped by the unique index.
  const txs = parsed.data.transactions;
  const createdKeys = await importBatch(user.id, txs);
  const results = txs.map((tx) => ({
    dedupeKey: tx.dedupeKey,
    // delete() returns true only once per key, so two identical keys in one batch count as one created, one duplicate
    status: createdKeys.delete(tx.dedupeKey) ? 'created' : 'duplicate',
  }));

  // Pair up moves between your own CBE and telebirr accounts, then apply your saved category rules.
  // A failure here must never break an import.
  try {
    await matchInternalTransfers(user.id);
    await applyCategoryRules(user.id); // after matching, so own transfers (internal) are skipped
  } catch (e) {
    console.error('transfer matching or category rules failed', e);
  }

  return NextResponse.json({ results });
}