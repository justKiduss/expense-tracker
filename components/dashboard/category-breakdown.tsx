import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-currency';

export interface CategorySlice {
  id: string;
  name: string;
  amountCents: number;
}

// Colors by position, written in full for Tailwind. Works for any number of categories.
const PALETTE = [
  { stroke: 'stroke-emerald-500', dot: 'bg-emerald-500' },
  { stroke: 'stroke-yellow-400', dot: 'bg-yellow-400' },
  { stroke: 'stroke-violet-500', dot: 'bg-violet-500' },
  { stroke: 'stroke-sky-500', dot: 'bg-sky-500' },
  { stroke: 'stroke-orange-500', dot: 'bg-orange-500' },
  { stroke: 'stroke-rose-500', dot: 'bg-rose-500' },
  { stroke: 'stroke-teal-400', dot: 'bg-teal-400' },
  { stroke: 'stroke-fuchsia-500', dot: 'bg-fuchsia-500' },
];

const R = 15.9155; // circle whose length is exactly 100, so a slice's percent = its dash length
const GAP = 0.6; // small gap between slices

export default function CategoryBreakdown({ items }: { items: CategorySlice[] }) {
  const total = items.reduce((sum, i) => sum + i.amountCents, 0);

   const pctOf = (amount: number) => (total > 0 ? (amount / total) * 100 : 0);

  const slices = items.map((item, i) => ({
    ...item,
    pct: pctOf(item.amountCents),
    offset: items.slice(0, i).reduce((sum, prev) => sum + pctOf(prev.amountCents), 0),
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <Card className="h-full">
      <h2 className="text-base font-semibold text-white">Spending by Category</h2>

      {total === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No spending this month.</p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div className="relative size-40 shrink-0">
            <svg viewBox="0 0 42 42" className="size-full" role="img" aria-label="Spending by category">
              <g transform="rotate(-90 21 21)">
                <circle cx="21" cy="21" r={R} fill="none" strokeWidth="5" className="stroke-neutral-800" />
                {slices.map((s) => {
                  const len = Math.max(s.pct - GAP, 0);
                  return (
                    <circle
                      key={s.id}
                      cx="21"
                      cy="21"
                      r={R}
                      fill="none"
                      strokeWidth="5"
                      className={s.color.stroke}
                      strokeDasharray={`${len} ${100 - len}`}
                      strokeDashoffset={-s.offset}
                    />
                  );
                })}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-white">ETB {formatCurrency(total)}</span>
              <span className="text-[11px] text-neutral-500">Total Expenses</span>
            </div>
          </div>

          <ul className="min-w-[140px] flex-1 space-y-2 text-sm">
            {slices.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${s.color.dot}`} aria-hidden="true" />
                <span className="flex-1 text-neutral-300">{s.name}</span>
                <span className="text-neutral-400">{Math.round(s.pct)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}