import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { setMonthlyLimit } from '@/lib/services/user.service';

const schema = z.object({ monthlyLimit: z.number().int().min(0).max(1_000_000_000).nullable() });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  await setMonthlyLimit(user.id, parsed.data.monthlyLimit);
  return NextResponse.json({ ok: true });
}