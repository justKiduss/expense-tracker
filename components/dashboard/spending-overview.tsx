'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utilis';

export interface BarPoint {
  label: string; // "Oct 15"
  valueCents: number;
}

// Picks a round top value that splits evenly into 4 steps (so the grid lines look clean)
function niceMax(maxCents: number) {
  const raw = Math.max(maxCents, 100) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return step * 4;
}

export default function SpendingOverview({ week, month }: { week: BarPoint[]; month: BarPoint[] }) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const data = range === '7d' ? week : month;

  const top = niceMax(Math.max(...data.map((d) => d.valueCents), 0));
  const biggest = Math.max(...data.map((d) => d.valueCents), 0);
  const crowded = data.length > 10;

  const tabBase = 'px-3 py-1.5 text-xs font-medium transition-colors';
  const tabOn = 'bg-emerald-500/15 text-emerald-400';
  const tabOff = 'text-neutral-400 hover:text-neutral-200';

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Spending Overview</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Your expenses over the last {range === '7d' ? '7' : '30'} days
          </p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-line">
          <button type="button" onClick={() => setRange('7d')} className={cn(tabBase, range === '7d' ? tabOn : tabOff)}>
            7D
          </button>
          <button type="button" onClick={() => setRange('30d')} className={cn(tabBase, range === '30d' ? tabOn : tabOff)}>
            30D
          </button>
          <button type="button" disabled className={cn(tabBase, 'cursor-not-allowed text-neutral-600')} title="Coming soon">
            Custom
          </button>
        </div>
      </div>

      {/* grid lines + y labels */}
      <div className="relative mt-6 h-44 pl-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute inset-x-0 flex translate-y-1/2 items-center" style={{ bottom: `${i * 25}%` }}>
            <span className="w-10 text-[11px] text-neutral-500">{Math.round((top * i) / 4 / 100)}</span>
            <div className="h-px flex-1 bg-line" />
          </div>
        ))}

        {/* bars */}
        <div className={cn('absolute inset-y-0 left-10 right-0 flex items-end', crowded ? 'gap-1' : 'gap-3')}>
          {data.map((d) => (
            <div key={d.label} className="flex h-full flex-1 items-end">
              <div
                className={cn('w-full rounded-t-md', d.valueCents === biggest ? 'bg-emerald-400' : 'bg-emerald-500/50')}
                style={{ height: `${(d.valueCents / top) * 100}%` }}
                title={`${d.label}: ETB ${(d.valueCents / 100).toFixed(2)}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* x labels */}
      <div className={cn('ml-10 mt-2 flex', crowded ? 'gap-1' : 'gap-3')}>
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 whitespace-nowrap text-center text-[11px] text-neutral-500">
            {!crowded || i % 5 === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </Card>
  );
}