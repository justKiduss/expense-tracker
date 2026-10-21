import Link from 'next/link';
import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import TransactionsFilters from '@/components/transactions/transation-filters';
import TransactionsTable from '@/components/transactions/transation-table';
import { getSpendingDetail } from '@/lib/services/spending-detail.service';
import { resolveReviewRange } from '@/lib/services/review.service';
import { getCategoryBreakdown } from '@/lib/services/transaction.service';
import { listCategories } from '@/lib/services/category.services';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utilis';
import { getCurrentUser } from '@/lib/auth/session';
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string }>;
}) {
  const { month, category = 'all' } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const userId = user.id;
  const email = user.email;


  const range = resolveReviewRange(month === 'all' ? undefined : month);
  const from = range.from as Date;
  const to = range.to as Date;
  const monthKey = range.month as string;

  const [rows, breakdown, categories] = await Promise.all([
    getSpendingDetail(userId, from, to, category),
    getCategoryBreakdown(userId, from, to),
    listCategories(userId),
  ]);

  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const chips = [
    { key: 'all', label: 'All spending', cents: breakdown.reduce((s, r) => s + r.spent, 0) },
    ...breakdown
      .map((r) => ({
        key: r.categoryId ?? 'uncategorised',
        label: r.categoryId ? (categoryNames[r.categoryId] ?? 'Unknown') : 'Uncategorised',
        cents: r.spent,
      }))
      .sort((a, b) => b.cents - a.cents),
  ];

  const shownTotal = rows.reduce((s, r) => s + r.countedCents, 0);
  const userName = email.split('@')[0];

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/transactions" userName={userName} userEmail={email} />
      <main className="min-w-0 flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Transactions</h1>
            <p className="mt-1 text-sm text-neutral-400">Every payment behind the totals, newest first.</p>
          </div>
          <TransactionsFilters month={monthKey} category={category} />
        </div>

        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={`/transactions?month=${monthKey}&category=${c.key}`}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                category === c.key
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-line text-neutral-300 hover:bg-panel',
              )}
            >
              {c.label} · {formatCurrency(c.cents)}
            </Link>
          ))}
        </div>

        <p className="text-sm text-neutral-400">
          {rows.length} {rows.length === 1 ? 'payment' : 'payments'} · total{' '}
          <span className="font-medium text-neutral-100">ETB {formatCurrency(shownTotal)}</span>
        </p>

        <TransactionsTable rows={rows} categoryNames={categoryNames} />
      </main>
    </div>
  );
}