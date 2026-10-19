import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { applyCategoryRules } from '@/lib/services/category-rules.service';

// Applies every saved rule to the history you already have. Safe to run repeatedly.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ categorised: await applyCategoryRules(user.id) });
}