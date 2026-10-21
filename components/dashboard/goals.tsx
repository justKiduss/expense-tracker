import { Laptop, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';
import { cn } from '@/lib/utilis';
import { formatBirrShort } from '@/lib/format-currency';

const ICONS = {
  shield: { Icon: ShieldCheck, badge: 'bg-emerald-500/15 text-emerald-400' },
  laptop: { Icon: Laptop, badge: 'bg-emerald-500/15 text-emerald-400' },
} as const;

export interface GoalItem {
  id: string;
  name: string;
  savedCents: number;
  targetCents: number;
  icon: keyof typeof ICONS;
}

export default function Goals({ items, viewAllHref = '/goals' }: { items: GoalItem[]; viewAllHref?: string }) {
  return (
    <Card>
      <CardHeader title="Goals" href={viewAllHref} />
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No goals yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map((g) => {
            const { Icon, badge } = ICONS[g.icon];
            const pct = g.targetCents > 0 ? Math.min(100, Math.round((g.savedCents / g.targetCents) * 100)) : 0;
            return (
              <li key={g.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', badge)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-100">{g.name}</p>
                  <p className="text-xs text-neutral-400">
                    ETB {formatBirrShort(g.savedCents)} / {formatBirrShort(g.targetCents)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${g.name} progress`}
                    >
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
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