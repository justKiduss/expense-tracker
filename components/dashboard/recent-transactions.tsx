import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utilis';
import { formatCurrency } from '@/lib/format-currency';

// Plain data the table needs. Money in cents, date as an ISO string.
export interface RecentTx {
  id: string;
  occurredAt: string;
  description: string;
  categoryName: string | null; // null = not categorised yet
  direction: 'in' | 'out';
  amountCents: number; // always positive; direction says the sign
}

// Addis Ababa time, same as the rest of the app
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Africa/Addis_Ababa',
  });
}

export default function RecentTransactions({
  items,
  viewAllHref = '/transactions',
}: {
  items: RecentTx[];
  viewAllHref?: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
        <Link href={viewAllHref} className="text-xs font-medium text-emerald-400 hover:underline">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No transactions yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-neutral-500">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 text-right font-medium">Amount (ETB)</th>
                <th className="py-2 pl-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const isOut = t.direction === 'out';
                const TypeIcon = isOut ? ArrowUpRight : ArrowDownLeft;
                return (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap py-3 pr-4 text-neutral-400">{formatDate(t.occurredAt)}</td>
                    <td className="py-3 pr-4 text-neutral-100">{t.description}</td>
                    <td className="py-3 pr-4">
                      {t.categoryName ? (
                        <span className="text-neutral-300">{t.categoryName}</span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                          Uncategorised
                        </span>
                      )}
                    </td>
                    <td
                      className={cn(
                        'whitespace-nowrap py-3 pr-4 text-right font-medium',
                        isOut ? 'text-rose-400' : 'text-emerald-400',
                      )}
                    >
                      {isOut ? '-' : '+'}
                      {formatCurrency(t.amountCents)}
                    </td>
                    <td className="py-3 pl-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium',
                          isOut ? 'text-rose-400' : 'text-emerald-400',
                        )}
                      >
                        <TypeIcon className="size-3.5" aria-hidden="true" />
                        {isOut ? 'Expense' : 'Income'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}