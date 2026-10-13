import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail } from '@/lib/services/user.service';
import { verifyPassword, DUMMY_HASH } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit';

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
    const email = parsed.data.email.toLowerCase();
  if (!(await rateLimit(`login:ip:${clientIp(request)}`, 20, 900)).allowed) return tooMany();
  if (!(await rateLimit(`login:email:${email}`, 8, 900)).allowed) return tooMany();

  const user = await findUserByEmail(parsed.data.email.toLowerCase());
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}