import { and, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices, transations } from '@/lib/db/schema';
import { getCategoryBreakdown, getSummary, listTransactions, spentSql } from '@/lib/services/transaction.service';
import { listCategories } from '@/lib/services/category.services';
import { percentChange } from '@/lib/utilis';
import type { OverviewItem } from '@/components/dashboard/overview-cards';
import type { BudgetItem } from '@/components/dashboard/budget-progress';
import type { CategorySlice } from '@/components/dashboard/category-breakdown';
import type { BarPoint } from '@/components/dashboard/spending-overview';
import type { RecentTx } from '@/components/dashboard/recent-transactions';
import type { AccountItem } from '@/components/dashboard/accounts-card';
import { getMonthlyLimit } from '@/lib/services/user.service';

const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, no daylight saving
const DAY_MS = 86_400_000;

const KIND_LABEL: Record<string, string> = {
  transfer_in: 'Transfer received',
  transfer_out: 'Transfer sent',
  payment: 'Payment',
  debit: 'Debit',
  credit: 'Credit',
  loan_received: 'Loan received',
  loan_repayment: 'Loan repayment',
  manual: 'Manual entry',
};

const INSTITUTIONS: Record<string, { name: string; kind: AccountItem['kind']; order: number }> = {
  CBE: { name: 'CBE', kind: 'bank', order: 0 },
  TELEBIRR: { name: 'telebirr', kind: 'wallet', order: 1 },
};

/** 'YYYY-MM' (or nothing) -> that month in Addis Ababa time. Future months fall back to the current month. */
function resolveMonth(month: string | undefined, now: Date) {
  const local = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const curY = local.getUTCFullYear();
  const curM = local.getUTCMonth();
  let y = curY;
  let m = curM;

  const match = month ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month) : null;
  if (match) {
    const ty = Number(match[1]);
    const tm = Number(match[2]) - 1;
    if (ty < curY || (ty === curY && tm <= curM)) {
      y = ty;
      m = tm;
    }
  }

  return {
    key: `${y}-${String(m + 1).padStart(2, '0')}`,
    from: new Date(Date.UTC(y, m, 1) - ADDIS_OFFSET_MS),
    to: new Date(Date.UTC(y, m + 1, 1) - ADDIS_OFFSET_MS),
    prevFrom: new Date(Date.UTC(y, m - 1, 1) - ADDIS_OFFSET_MS),
    isCurrent: y === curY && m === curM,
  };
}

async function getFees(userId: string, from: Date, to: Date) {
  const [row] = await db
    .select({ fees: sql<number>`coalesce(sum(${transations.fee}), 0)`.mapWith(Number) })
    .from(transations)
    .where(and(eq(transations.userId, userId), gte(transations.occurredAt, from), lt(transations.occurredAt, to)));
  return row.fees;
}

/** Uncategorised spending rows (same idea as "spent": not internal, not a loan repayment). */
async function countNeedsCategory(userId: string, from: Date, to: Date) {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(transations)
    .where(
      and(
        eq(transations.userId, userId),
        gte(transations.occurredAt, from),
        lt(transations.occurredAt, to),
        isNull(transations.categoryId),
        eq(transations.direction, 'out'),
        eq(transations.isInternal, false),
        ne(transations.kind, 'loan_repayment'),
      ),
    );
  return row.n;
}

/** Transfers between your own accounts: a matched pair counts once, a hand-marked row counts once. */
async function countInternalTransfers(userId: string, from: Date, to: Date) {
  const [row] = await db
    .select({
      n: sql<number>`count(distinct coalesce(${transations.transferPairId}::text, ${transations.id}::text))`.mapWith(Number),
    })
    .from(transations)
    .where(
      and(
        eq(transations.userId, userId),
        gte(transations.occurredAt, from),
        lt(transations.occurredAt, to),
        eq(transations.isInternal, true),
      ),
    );
  return row.n;
}

async function getSyncStatus(userId: string, now: Date) {
  const local = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const todayStart = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - ADDIS_OFFSET_MS,
  );

  const [[device], [today]] = await Promise.all([
    db
      .select({ last: sql<Date | string | null>`max(${devices.lastSeenAt})` })
      .from(devices)
      .where(and(eq(devices.userId, userId), isNull(devices.revokedAt))),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(transations)
      .where(and(eq(transations.userId, userId), eq(transations.source, 'sms'), gte(transations.createdAt, todayStart))),
  ]);

  return {
    lastSyncedAt: device?.last ? new Date(device.last).toISOString() : null,
    newMessagesToday: today.n,
  };
}

/** Latest known balance per institution (from the last message that printed one). */
async function getAccounts(userId: string): Promise<AccountItem[]> {
  const rows = await db
    .selectDistinctOn([transations.institution], {
      institution: transations.institution,
      balance: transations.balanceAfter,
      at: transations.occurredAt,
    })
    .from(transations)
    .where(and(eq(transations.userId, userId), isNotNull(transations.institution), isNotNull(transations.balanceAfter)))
    .orderBy(transations.institution, desc(transations.occurredAt));

  return rows
    .map((r) => {
      const info = INSTITUTIONS[r.institution ?? ''] ?? { name: r.institution ?? 'Account', kind: 'bank' as const, order: 9 };
      return {
        order: info.order,
        item: {
          id: r.institution ?? 'unknown',
          name: info.name,
          kind: info.kind,
          balanceCents: r.balance,
          asOf: r.at.toISOString(),
        } satisfies AccountItem,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((x) => x.item);
}

/** Spending per day for the last `days` days (Addis days), oldest first. Zero-spend days are included. */
async function getDailySeries(userId: string, days: number, now: Date): Promise<BarPoint[]> {
  const local = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const todayUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const startMs = todayUtc - (days - 1) * DAY_MS;
  const from = new Date(startMs - ADDIS_OFFSET_MS);
  const to = new Date(todayUtc + DAY_MS - ADDIS_OFFSET_MS);

  const dayKey = sql<string>`to_char(${transations.occurredAt} at time zone 'Africa/Addis_Ababa', 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day: dayKey, spent: spentSql })
    .from(transations)
    .where(and(eq(transations.userId, userId), gte(transations.occurredAt, from), lt(transations.occurredAt, to)))
    .groupBy(dayKey);

  const byDay = new Map(rows.map((r) => [r.day, r.spent]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startMs + i * DAY_MS);
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      valueCents: byDay.get(d.toISOString().slice(0, 10)) ?? 0,
    };
  });
}

export async function getDashboardData(userId: string, monthParam?: string) {
  const now = new Date();
  const { key, from, to, prevFrom, isCurrent } = resolveMonth(monthParam, now);
  
  // Fair comparison: this month so far against the same number of days last month.
  const elapsed = isCurrent ? now.getTime() - from.getTime() : Infinity;
  const prevTo = new Date(Math.min(prevFrom.getTime() + elapsed, from.getTime()));
  const compareLabel = isCurrent ? 'same days last month' : 'the month before';

    const [
    cur,
    prev,
    fees,
    needsCategoryCount,
    internalTransfers,
    sync,
    accounts,
    daily,
    categoriesList,
    breakdown,
    recentRows,
    limitCents,
  ] = await Promise.all([
    getSummary(userId, from, to),
    getSummary(userId, prevFrom, prevTo),
    getFees(userId, from, to),
    countNeedsCategory(userId, from, to),
    countInternalTransfers(userId, from, to),
    getSyncStatus(userId, now),
    getAccounts(userId),
    getDailySeries(userId, 30, now),
    listCategories(userId),
    getCategoryBreakdown(userId, from, to),
    listTransactions(userId, { from, to }, 5),
    getMonthlyLimit(userId),
  ]);
  const nameById = new Map(categoriesList.map((c) => [c.id, c.name]));
  const spentById = new Map(breakdown.map((r) => [r.categoryId, r.spent]));

  const overview: OverviewItem[] = [
    { id: 'expenses', valueCents: cur.expenses, changePercent: percentChange(cur.expenses, prev.expenses), compareLabel },
    { id: 'income', valueCents: cur.income, changePercent: percentChange(cur.income, prev.income), compareLabel },
    { id: 'net', valueCents: cur.net, changePercent: null, note: 'Income minus spent' },
    { id: 'fees', valueCents: fees, changePercent: null, note: 'Already inside spent' },
  ];

  const budgets: BudgetItem[] = categoriesList
    .filter((c) => c.monthlyBudget !== null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      spentCents: spentById.get(c.id) ?? 0,
      budgetCents: c.monthlyBudget as number,
    }));

  const categories: CategorySlice[] = breakdown
    .map((r) => ({
      id: r.categoryId ?? 'uncategorised',
      name: r.categoryId ? (nameById.get(r.categoryId) ?? 'Unknown') : 'Uncategorised',
      amountCents: r.spent,
    }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const recent: RecentTx[] = recentRows.map((r) => ({
    id: r.id,
    occurredAt: r.occurredAt.toISOString(),
    description: r.counterparty ?? r.description ?? KIND_LABEL[r.kind] ?? r.kind,
    categoryName: r.categoryId ? (nameById.get(r.categoryId) ?? null) : null,
    direction: r.direction as 'in' | 'out',
    amountCents: r.amount,
  }));
  const localNow = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const daysInMonth = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  const daysLeft = isCurrent ? daysInMonth - localNow.getUTCDate() + 1 : null;

  return {
    limit: { limitCents: limitCents ?? null, spentCents: cur.expenses, daysLeft },
    month: key,
    attention: { needsCategoryCount, ...sync },
    overview,
    budgets,
    categories,
    accounts: { accounts, internalTransfersExcluded: internalTransfers },
    week: daily.slice(-7),
    month30: daily,
    recent,
  };
}