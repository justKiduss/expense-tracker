import { ArrowDown, ArrowUp, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sparkline } from '@/components/ui/sparkline';
import { cn } from '@/lib/utilis';
import { formatCurrency } from '@/lib/format-currency';

// Everything about how each card LOOKS lives here. Colors are written in full on purpose (Tailwind needs that).
const CONFIG = {
  balance:  { label: 'Total Balance',    Icon: Wallet,       goodWhen: 'up',   badge: 'bg-emerald-500/15 text-emerald-400', spark: 'text-emerald-400' },
  expenses: { label: 'Monthly Expenses', Icon: TrendingDown, goodWhen: 'down', badge: 'bg-rose-500/15 text-rose-400',       spark: 'text-rose-400' },
  income:   { label: 'Monthly Income',   Icon: TrendingUp,   goodWhen: 'up',   badge: 'bg-sky-500/15 text-sky-400',         spark: 'text-sky-400' },
  net:      { label: 'Net this month',   Icon: PiggyBank,    goodWhen: 'up',   badge: 'bg-violet-500/15 text-violet-400',   spark: 'text-violet-400' },
} as const;

// The data the card needs, and nothing else. Plain numbers, so it can come from fake data now and the database later.
export interface OverviewItem {
  id: keyof typeof CONFIG;
  valueCents: number;
  changePercent: number | null; // vs last month; null = no last month to compare with
  trend: number[]; // the points of the small chart
}

function Change({ percent, goodWhen }: { percent: number | null; goodWhen: 'up' | 'down' }) {
  if (percent === null) return <p className="mt-2 text-xs text-neutral-500">No data for last month</p>;
  const up = percent >= 0;
  const good = up === (goodWhen === 'up'); // for expenses, going DOWN is the good news
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs">
      <span className={cn('flex items-center gap-0.5 font-medium', good ? 'text-emerald-400' : 'text-rose-400')}>
        <Arrow className="size-3.5" aria-hidden="true" />
        {Math.abs(percent).toFixed(1)}%
      </span>
      <span className="text-neutral-500">vs. last month</span>
    </p>
  );
}

export default function OverviewCards({ items }: { items: OverviewItem[] }) {
  return (
    <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ id, valueCents, changePercent, trend }) => {
        const c = CONFIG[id];
        const Icon = c.Icon;
        return (
          <Card key={id} className="overflow-hidden">
            <div className="flex items-center gap-3">
              <span className={cn('flex size-10 items-center justify-center rounded-lg', c.badge)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-neutral-300">{c.label}</p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">ETB {formatCurrency(valueCents)}</p>
            <Change percent={changePercent} goodWhen={c.goodWhen} />
            <Sparkline data={trend} className={cn('mt-3 h-10 w-full', c.spark)} />
          </Card>
        );
      })}
    </section>
  );
}