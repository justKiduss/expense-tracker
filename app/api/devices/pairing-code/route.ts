import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createPairingCode } from '@/lib/services/device.service';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await createPairingCode(user.id));
}