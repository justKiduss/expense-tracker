import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createCategory, listCategories } from '@/lib/services/category.services';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ categories: await listCategories(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = z.object({ name: z.string().trim().min(1).max(40) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

  const row = await createCategory(user.id, parsed.data.name);
  if (!row) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
  return NextResponse.json({ category: row }, { status: 201 });
}