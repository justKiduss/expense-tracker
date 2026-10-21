import type { OverviewItem } from '@/components/dashboard/overview-cards';
import type { RecentTx } from '@/components/dashboard/recent-transactions'
import type { BarPoint } from '@/components/dashboard/spending-overview';
import type { CategorySlice } from '@/components/dashboard/category-breakdown';
import type { BillItem } from '@/components/dashboard/upcoming-bills';
import type { BudgetItem } from '@/components/dashboard/budget-progress';
import type { GoalItem } from '@/components/dashboard/goals';
import type { AccountItem } from '@/components/dashboard/accounts-card';

export const mockRecent: RecentTx[] = [
  { id: '1', occurredAt: '2026-10-20T09:15:00+03:00', description: 'Shoa Supermarket', categoryName: 'Food', direction: 'out', amountCents: 185000 },
  { id: '2', occurredAt: '2026-10-19T18:40:00+03:00', description: 'Ride to Bole', categoryName: 'Transport', direction: 'out', amountCents: 25000 },
  { id: '3', occurredAt: '2026-10-18T12:05:00+03:00', description: 'Airtime recharge', categoryName: 'Airtime & Data', direction: 'out', amountCents: 10000 },
  { id: '4', occurredAt: '2026-10-17T16:30:00+03:00', description: 'Transfer to Abebe', categoryName: null, direction: 'out', amountCents: 50000 },
  { id: '5', occurredAt: '2026-10-15T10:00:00+03:00', description: 'Salary', categoryName: 'Other', direction: 'in', amountCents: 1500000 },
];

export const mockWeek: BarPoint[] = [
  { label: 'Oct 15', valueCents: 8500 },
  { label: 'Oct 16', valueCents: 11500 },
  { label: 'Oct 17', valueCents: 8000 },
  { label: 'Oct 18', valueCents: 13000 },
  { label: 'Oct 19', valueCents: 11000 },
  { label: 'Oct 20', valueCents: 17500 },
  { label: 'Oct 21', valueCents: 12000 },
];

// 30 days ending Oct 21 (fixed fake values, so server and browser render the same)
export const mockMonth: BarPoint[] = Array.from({ length: 30 }, (_, i) => ({
  label: new Date(Date.UTC(2026, 9, 21 - 29 + i)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }),
  valueCents: 4000 + ((i * 37) % 11) * 1200,
}));

// sums to 128000 (ETB 1,280.00)
export const mockCategories: CategorySlice[] = [
  { id: 'food', name: 'Food', amountCents: 35840 },
  { id: 'transport', name: 'Transport', amountCents: 20480 },
  { id: 'shopping', name: 'Shopping', amountCents: 19200 },
  { id: 'bills', name: 'Bills', amountCents: 12800 },
  { id: 'entertainment', name: 'Entertainment', amountCents: 12800 },
  { id: 'health', name: 'Health', amountCents: 8960 },
  { id: 'other', name: 'Other', amountCents: 17920 },
];

export const mockBills: BillItem[] = [
  { id: 'b1', name: 'Electricity Bill', dueInDays: 4, amountCents: 45000, icon: 'electricity' },
  { id: 'b2', name: 'Internet', dueInDays: 6, amountCents: 25000, icon: 'internet' },
  { id: 'b3', name: 'Rent', dueInDays: 12, amountCents: 300000, icon: 'rent' },
];



export const mockGoals: GoalItem[] = [
  { id: 'g1', name: 'Emergency Fund', savedCents: 152000, targetCents: 300000, icon: 'shield' },
  { id: 'g2', name: 'New Laptop', savedCents: 80000, targetCents: 150000, icon: 'laptop' },
];

export const mockAttention = {
  needsCategoryCount: 7,
  lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  newMessagesToday: 12,
};

export const mockOverview: OverviewItem[] = [
  { id: 'expenses', valueCents: 128000, changePercent: -12.5 },
  { id: 'income', valueCents: 280000, changePercent: 5.1 },
  { id: 'net', valueCents: 152000, changePercent: null, note: 'Income minus spent' },
  { id: 'fees', valueCents: 8550, changePercent: null, note: 'Already inside spent' },
];

export const mockBudgets: BudgetItem[] = [
  { id: 'c1', name: 'Food', spentCents: 32000, budgetCents: 50000 },
  { id: 'c2', name: 'Transport', spentCents: 12000, budgetCents: 30000 },
  { id: 'c3', name: 'Entertainment', spentCents: 17000, budgetCents: 20000 },
  { id: 'c4', name: 'Airtime & Data', spentCents: 6000, budgetCents: 15000 },
];

export const mockAccounts: { accounts: AccountItem[]; internalTransfersExcluded: number } = {
  accounts: [
    { id: 'cbe', name: 'CBE', kind: 'bank', balanceCents: 342050 },
    { id: 'telebirr', name: 'telebirr', kind: 'wallet', balanceCents: 82950 },
  ],
  internalTransfersExcluded: 2,
};