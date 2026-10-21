import { Home, Wifi, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';
import { cn } from '@/lib/utilis';
import { formatCurrency } from '@/lib/format-currency';

const ICONS = {
  electricity: { Icon: Zap, badge: 'bg-amber-500/15 text-amber-400' },
  internet: { Icon: Wifi, badge: 'bg-sky-500/15 text-sky-400' },
  rent: { Icon: Home, badge: 'bg-emerald-500/15 text-emerald-400' },
} as const;

export interface BillItem {
  id: string;
  name: string;
  dueInDays: number; // negative = overdue
  amountCents: number;
  icon: keyof typeof ICONS;
}

function dueText(days: number) {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export default function UpcomingBills({ items, viewAllHref = '/bills' }: { items: BillItem[]; viewAllHref?: string }) {
  return (
    <Card>
      <CardHeader title="Upcoming Bills" href={viewAllHref} />
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No bills coming up.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map((b) => {
            const { Icon, badge } = ICONS[b.icon];
            return (
              <li key={b.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', badge)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-100">{b.name}</p>
                  <p className={cn('text-xs', b.dueInDays < 0 ? 'text-rose-400' : 'text-neutral-500')}>
                    {dueText(b.dueInDays)}
                  </p>
                </div>
                <p className="text-sm font-medium text-white">ETB {formatCurrency(b.amountCents)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}