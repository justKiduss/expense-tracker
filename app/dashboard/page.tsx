import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { listTransations, getSummary, getCategoryBreakdown, currentMonthRange } from '@/lib/services/transaction.service';
import { listCategories } from '@/lib/services/category.services';
import { getMonthlyLimit } from '@/lib/services/user.service';
import LogoutButton from '@/components/logout-button';
import ImportForm from '@/components/import-form';
import TransactionList from '@/components/transaction-list';
import SummaryCards from '@/components/summary-cards';
import BudgetPanel from '@/components/budget-panel';
import CategoryBreakdown from '@/components/category-breakdown';
import { listDevices } from '@/lib/services/device.service';
import DevicesPanel from '@/components/devices-panel';
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const month = currentMonthRange();

  const [items, summary, breakdown, categories, limit, devices] = await Promise.all([
    listTransations(user.id),
    getSummary(user.id, month.from, month.to),
    getCategoryBreakdown(user.id, month.from, month.to),
    listCategories(user.id),
    getMonthlyLimit(user.id),
    listDevices(user.id),
  ]);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm opacity-70">{user.email}</p>

      <BudgetPanel limit={limit} spent={summary.expenses} daysLeft={month.daysLeft} />
      <SummaryCards label={month.label} {...summary} />
      <ImportForm />
      <CategoryBreakdown categories={categories} breakdown={breakdown} />
      <TransactionList items={items} categories={categories} />

      <DevicesPanel
          devices={devices.map((d) => ({
            id: d.id,
            name: d.name,
            createdAt: d.createdAt.toISOString(),
            lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
            revokedAt: d.revokedAt?.toISOString() ?? null,
          }))}
      />
    </main>
  );
}