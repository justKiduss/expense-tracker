import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pairDevice } from '@/lib/services/device.service';

const schema = z.object({
  code: z.string().regex(/^\d{8}$/),
  deviceName: z.string().trim().min(1).max(60),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const token = await pairDevice(parsed.data.code, parsed.data.deviceName);
  if (!token) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  return NextResponse.json({ deviceToken: token });
}