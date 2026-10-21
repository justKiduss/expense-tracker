import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import OverviewHeader from '@/components/layout/overview-header';
import AttentionStrip from '@/components/dashboard/attention-strip';
import OverviewCards from '@/components/dashboard/overview-cards';
import BudgetProgress from '@/components/dashboard/budget-progress';
import AccountsCard from '@/components/dashboard/accounts-card';
import SpendingOverview from '@/components/dashboard/spending-overview';
import CategoryBreakdown from '@/components/dashboard/category-breakdown';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import { getDashboardData } from '@/lib/services/dashboard.service';
import { getCurrentUser } from '@/lib/auth/session';
export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;

  // --- AUTH: copy the lines from the top of app/dashboard/page.tsx that get the signed-in user ---
  // They must leave you with `userId` and `email`, and redirect to '/login' when nobody is signed in.
  // -----------------------------------------------------------------------------------------------
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const data = await getDashboardData(user?.id, month);
  const userName = user.email.split('@')[0];

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/overview" userName={userName} userEmail={user.email} />

      <div className="flex min-w-0 flex-1 flex-col">
        <OverviewHeader userName={userName} month={data.month} />
        <main className="flex-1 space-y-6 p-6">
          <AttentionStrip {...data.attention} reviewHref='/review'/>
          <OverviewCards items={data.overview} />

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <BudgetProgress items={data.budgets} month={data.month}/>
            </div>
            <div className="lg:col-span-2">
              <AccountsCard {...data.accounts} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SpendingOverview week={data.week} month={data.month30} />
            </div>
            <div className="lg:col-span-2">
              <CategoryBreakdown items={data.categories} />
            </div>
          </div>

          <RecentTransactions items={data.recent} />
        </main>
      </div>
    </div>
  );
}