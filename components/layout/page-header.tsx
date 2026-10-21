'use client';

import { Plus, Search } from 'lucide-react';
import { greeting } from '@/lib/utilis';

export interface PageHeaderProps {
  userName: string;
  month: string; // 'YYYY-MM'
  onMonthChange: (month: string) => void;
  onAddTransaction: () => void;
  onSearchClick: () => void;
}

export default function PageHeader({ userName, month, onMonthChange, onAddTransaction, onSearchClick }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-white" suppressHydrationWarning>
          {greeting()}
        </h1>
        <label className="mt-1 inline-flex items-center">
          <span className="sr-only">Month</span>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && onMonthChange(e.target.value)}
            className="rounded-md border border-line bg-transparent px-2 py-1 text-sm text-neutral-300 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddTransaction}
          aria-label="Add transaction"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-400"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add transaction</span>
        </button>
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search"
          className="flex size-10 items-center justify-center rounded-lg border border-line text-neutral-300 transition-colors hover:bg-white/5"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
        <span
          className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-neutral-950"
          aria-label={userName}
        >
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  );
}