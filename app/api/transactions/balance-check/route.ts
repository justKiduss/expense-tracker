import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';
import { checkBalanceChain } from '@/lib/balance.check';

// A precision audit of your own data: does every balance follow from the one before it?
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: transations.id,
      institution: transations.institution,
      direction: transations.direction,
      amount: transations.amount,
      fee: transations.fee,
      balanceAfter: transations.balanceAfter,
      at: transations.occurredAt,
    })
    .from(transations)
    .where(eq(transations.userId, user.id)) // the ownership rule
    .orderBy(asc(transations.occurredAt));

  const report = checkBalanceChain(
    rows.flatMap((r) =>
      r.institution && (r.direction === 'in' || r.direction === 'out')
        ? [{ ...r, institution: r.institution, direction: r.direction }]
        : [],
    ),
  );

  const birr = (cents: number) => (cents / 100).toFixed(2);
  return NextResponse.json({
    checked: report.checked,
    consistent: report.consistent,
    skipped: report.skipped,
    percentConsistent: report.checked ? Math.round((report.consistent / report.checked) * 1000) / 10 : null,
    firstBreaks: report.breaks.slice(-40).reverse().map((b) => ({
      institution: b.institution,
      at: b.at.toISOString(),
      expectedBalance: birr(b.expected),
      actualBalance: birr(b.actual),
      unexplained: birr(b.gap), // positive: money arrived with no message; negative: money left with no message
    })),
    totalBreaks: report.breaks.length,
  });
}