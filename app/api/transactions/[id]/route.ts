import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { updateTransactionMeta } from '@/lib/services/transaction.service';
import { setCategory } from '@/lib/services/category-rules.service';

const patchSchema = z
  .object({
    categoryId: z.uuid().nullable().optional(),
    isInternal: z.boolean().optional(),
    remember: z.enum(['none', 'counterparty', 'amount']).optional(), // turn this choice into a rule
  })
  .refine((v) => v.categoryId !== undefined || v.isInternal !== undefined);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  let transaction = null;
  let applied = 0;

  if (parsed.data.isInternal !== undefined) {
    transaction = await updateTransactionMeta(user.id, id, { isInternal: parsed.data.isInternal });
    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (parsed.data.categoryId !== undefined) {
    const result = await setCategory(user.id, id, parsed.data.categoryId, parsed.data.remember ?? 'none');
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 }); // not yours, or not your category
    transaction = result.transaction;
    applied = result.applied; // how many OTHER transactions were categorised by the new rule
  }
  return NextResponse.json({ transaction, applied });
}