import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUser } from '@/lib/auth/request-user';
import { importParsedTransation } from '@/lib/services/transaction.service';

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

  const results: { dedupeKey: string; status: 'created' | 'duplicate' }[] = [];
  for (const tx of parsed.data.transactions) {
    const saved = await importParsedTransation(user.id, tx);
    results.push({ dedupeKey: tx.dedupeKey, status: saved ? 'created' : 'duplicate' });
  }
  return NextResponse.json({ results });
}