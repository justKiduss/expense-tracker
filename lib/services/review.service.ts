import { and, desc, eq, gte, isNull, lt, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transations } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format-currency';
import { KIND_LABEL } from '@/lib/services/spending-detail.service';

const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3
const DAY_MS = 86_400_000;

export type ReviewPayment = {
  id: string;
  occurredAt: string; // ISO
  totalCents: number;
  note: string | null;
};

export type ReviewGroup = {
  key: string;
  sampleId: string;
  label: string;
  kindLabel: string;
  remember: 'counterparty' | 'amount';
  count: number;
  totalCents: number;
  lastAt: string; // ISO
  payments: ReviewPayment[]; // newest first, max 30
};

export type ReviewRange = {
  from: Date | null;
  to: Date | null;
  month: string | null;
  day: string | null;
  all: boolean;
};

/** ?month=YYYY-MM | all, ?day=YYYY-MM-DD  ->  a date range in Addis Ababa time. Default: this month. */
export function resolveReviewRange(month?: string, day?: string): ReviewRange {
  const dayMatch = day ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  if (dayMatch) {
    const start = Date.UTC(Number(dayMatch[1]), Number(dayMatch[2]) - 1, Number(dayMatch[3])) - ADDIS_OFFSET_MS;
    return { from: new Date(start), to: new Date(start + DAY_MS), month: null, day: day as string, all: false };
  }

  if (month === 'all') return { from: null, to: null, month: null, day: null, all: true };

  const local = new Date(Date.now() + ADDIS_OFFSET_MS);
  let y = local.getUTCFullYear();
  let m = local.getUTCMonth();
  const monthMatch = month ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month) : null;
  if (monthMatch) {
    y = Number(monthMatch[1]);
    m = Number(monthMatch[2]) - 1;
  }
  return {
    from: new Date(Date.UTC(y, m, 1) - ADDIS_OFFSET_MS),
    to: new Date(Date.UTC(y, m + 1, 1) - ADDIS_OFFSET_MS),
    month: `${y}-${String(m + 1).padStart(2, '0')}`,
    day: null,
    all: false,
  };
}

/** Uncategorised spending in the range, grouped by person paid, or by amount when there is no name. */
export async function getReviewGroups(userId: string, range: ReviewRange, limit = 40): Promise<ReviewGroup[]> {
  const conditions = [
    eq(transations.userId, userId),
    isNull(transations.categoryId),
    eq(transations.direction, 'out'),
    eq(transations.isInternal, false),
    ne(transations.kind, 'loan_repayment'),
  ];
  if (range.from) conditions.push(gte(transations.occurredAt, range.from));
  if (range.to) conditions.push(lt(transations.occurredAt, range.to));

  const rows = await db
    .select({
      id: transations.id,
      counterparty: transations.counterparty,
      description: transations.description,
      kind: transations.kind,
      amount: transations.amount,
      fee: transations.fee,
      occurredAt: transations.occurredAt,
    })
    .from(transations)
    .where(and(...conditions))
    .orderBy(desc(transations.occurredAt)) // newest first, so the first row of a group is its latest
    .limit(3000);

  const groups = new Map<string, ReviewGroup>();
  for (const r of rows) {
    const byName = r.counterparty !== null;
    const key = byName ? `c:${r.counterparty}` : `a:${r.amount}`;
    const total = r.amount + (r.fee ?? 0);
    const payment: ReviewPayment = {
      id: r.id,
      occurredAt: r.occurredAt.toISOString(),
      totalCents: total,
      note: r.description,
    };

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalCents += total;
      existing.payments.push(payment);
    } else {
      groups.set(key, {
        key,
        sampleId: r.id,
        label: byName ? (r.counterparty as string) : `Payments of ${formatCurrency(r.amount)}`,
        kindLabel: KIND_LABEL[r.kind] ?? r.kind,
        remember: byName ? 'counterparty' : 'amount',
        count: 1,
        totalCents: total,
        lastAt: payment.occurredAt,
        payments: [payment],
      });
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, limit)
    .map((g) => ({ ...g, payments: g.payments.slice(0, 30) }));
}