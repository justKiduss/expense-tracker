import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail } from '@/lib/service/user.service';
import { verifyPassword, DUMMY_HASH } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
  }

  const user = await findUserByEmail(parsed.data.email.toLowerCase());
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}