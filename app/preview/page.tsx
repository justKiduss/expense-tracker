'use client';

import { useState } from 'react';
import AppSidebar from '@/components/layout/app-sidebar';
import PageHeader from '@/components/layout/page-header';
import AttentionStrip from '@/components/dashboard/attention-strip';
import OverviewCards from '@/components/dashboard/overview-cards';
import SpendingOverview from '@/components/dashboard/spending-overview';
import CategoryBreakdown from '@/components/dashboard/category-breakdown';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import UpcomingBills from '@/components/dashboard/upcoming-bills';
import BudgetProgress from '@/components/dashboard/budget-progress';
import Goals from '@/components/dashboard/goals';
import {
  mockAttention,
  mockOverview,
  mockRecent,
  mockWeek,
  mockMonth,
  mockCategories,
  mockBills,
  mockBudgets,
  mockGoals,
} from '@/lib/mock-data';

export default function PreviewPage() {
  const [month, setMonth] = useState('2026-10');

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/dashboard" userName="Kidus" userEmail="kidus@example.com" />

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          userName="Kidus"
          month={month}
          onMonthChange={setMonth}
          onAddTransaction={() => console.log('add transaction')}
          onSearchClick={() => console.log('search')}
        />
        <main className="flex-1 p-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <AttentionStrip {...mockAttention} />
              <OverviewCards items={mockOverview} />
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <SpendingOverview week={mockWeek} month={mockMonth} />
                </div>
                <div className="lg:col-span-2">
                  <CategoryBreakdown items={mockCategories} />
                </div>
              </div>
              <RecentTransactions items={mockRecent} />
            </div>

            <aside className="space-y-6">
              <UpcomingBills items={mockBills} />
              <BudgetProgress items={mockBudgets} />
              <Goals items={mockGoals} />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}