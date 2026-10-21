'use client';

import { useState } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import OverviewCards from '@/components/dashboard/overview-cards';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import SpendingOverview from '@/components/dashboard/spending-overview';
import CategoryBreakdown from '@/components/dashboard/category-breakdown';
import UpcomingBills from '@/components/dashboard/upcoming-bills';
import BudgetProgress from '@/components/dashboard/budget-progress';
import Goals from '@/components/dashboard/goals';
import { mockOverview, mockRecent, mockWeek, mockMonth, mockCategories, mockBills, mockBudgets, mockGoals,mockAttention } from '@/lib/mock-data';
import AttentionStrip from '@/components/dashboard/attention-strip';

export default function PreviewPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [month, setMonth] = useState('2026-10');

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/dashboard" userName="Kidus" userEmail="kidus@example.com" />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          userName="Kidus"
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          month={month}
          onMonthChange={setMonth}
          onSearch={(q) => console.log('search for:', q)}
          hasUnread
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