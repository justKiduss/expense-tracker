import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { updateTransactionMeta } from '@/lib/services/transaction.service';

const patchSchema = z
  .object({ categoryId: z.uuid().nullable().optional(), isInternal: z.boolean().optional() })
  .refine((v) => v.categoryId !== undefined || v.isInternal !== undefined);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const row = await updateTransactionMeta(user.id, id, parsed.data);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ transaction: row });
}