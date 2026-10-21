import { ArrowDownToLine, Coins, TrendingUp, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utilis';
import { formatCurrency } from '@/lib/format-currency';

// Colors written in full on purpose (Tailwind needs that)
const CONFIG = {
  expenses: { label: 'Spent this month', Icon: Wallet, goodWhen: 'down', badge: 'bg-rose-500/15 text-rose-400' },
  income: { label: 'Income', Icon: ArrowDownToLine, goodWhen: 'up', badge: 'bg-sky-500/15 text-sky-400' },
  net: { label: 'Net cash flow', Icon: TrendingUp, goodWhen: 'up', badge: 'bg-emerald-500/15 text-emerald-400' },
  fees: { label: 'Fees & levies', Icon: Coins, goodWhen: 'down', badge: 'bg-amber-500/15 text-amber-400' },
} as const;

export interface OverviewItem {
  id: keyof typeof CONFIG;
  valueCents: number;
  changePercent: number | null; // vs last month; null = nothing to compare with
  note?: string; // shown instead of the change line
}

function Note({ item }: { item: OverviewItem }) {
  if (item.note) return <p className="mt-2 text-xs text-neutral-400">{item.note}</p>;
  if (item.changePercent === null) return <p className="mt-2 text-xs text-neutral-500">No data for last month</p>;

  const up = item.changePercent >= 0;
  const good = up === (CONFIG[item.id].goodWhen === 'up'); // for spending, going DOWN is the good news
  return (
    <p className={cn('mt-2 text-xs', good ? 'text-emerald-400' : 'text-rose-400')}>
      {Math.abs(item.changePercent).toFixed(1)}% {up ? 'more' : 'less'} than last month
    </p>
  );
}

export default function OverviewCards({ items }: { items: OverviewItem[] }) {
  return (
    <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const c = CONFIG[item.id];
        const Icon = c.Icon;
        const plus = item.id === 'net' && item.valueCents > 0 ? '+' : '';
        return (
          <Card key={item.id}>
            <div className="flex items-center gap-3">
              <span className={cn('flex size-10 items-center justify-center rounded-lg', c.badge)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-neutral-300">{c.label}</p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">
              {plus}ETB {formatCurrency(item.valueCents)}
            </p>
            <Note item={item} />
          </Card>
        );
      })}
    </section>
  );
}