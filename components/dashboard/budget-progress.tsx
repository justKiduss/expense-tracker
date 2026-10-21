import { Car, Gamepad2, HeartPulse, ShoppingBag, ShoppingCart, Tag,Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';
import { cn } from '@/lib/utilis';
import { formatBirrShort } from '@/lib/format-currency';

// Icon and color by category name. Any other category gets the fallback.
const ICONS: Record<string, { Icon: typeof Tag; badge: string }> = {
  Food: { Icon: ShoppingCart, badge: 'bg-emerald-500/15 text-emerald-400' },
  Transport: { Icon: Car, badge: 'bg-sky-500/15 text-sky-400' },
  Shopping: { Icon: ShoppingBag, badge: 'bg-rose-500/15 text-rose-400' },
  Entertainment: { Icon: Gamepad2, badge: 'bg-orange-500/15 text-orange-400' },
  Health: { Icon: HeartPulse, badge: 'bg-blue-500/15 text-blue-400' },
    'Airtime & Data': { Icon: Smartphone, badge: 'bg-violet-500/15 text-violet-400' },
};
const FALLBACK = { Icon: Tag, badge: 'bg-neutral-500/15 text-neutral-300' };

export interface BudgetItem {
  id: string;
  name: string; // category name
  spentCents: number;
  budgetCents: number;
}

export default function BudgetProgress({ items, viewAllHref = '/budgets' }: { items: BudgetItem[]; viewAllHref?: string }) {
  return (
    <Card className='h-full'>
      <CardHeader title="Monthly Budget Progress" href={viewAllHref} />
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No category budgets set yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((b) => {
            const { Icon, badge } = ICONS[b.name] ?? FALLBACK;
            const pct = b.budgetCents > 0 ? Math.round((b.spentCents / b.budgetCents) * 100) : 0;
            const bar = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500';
            return (
              <li key={b.id} className="flex items-center gap-3">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', badge)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate text-neutral-100">{b.name}</span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      ETB {formatBirrShort(b.spentCents)} / {formatBirrShort(b.budgetCents)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800"
                      role="progressbar"
                      aria-valuenow={Math.min(pct, 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${b.name} budget used`}
                    >
                      <div className={cn('h-full rounded-full', bar)} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs text-neutral-400">{pct}%</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}