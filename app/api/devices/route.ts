// app/api/devices/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listDevices } from '@/lib/services/device.service';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ devices: await listDevices(user.id) });
}