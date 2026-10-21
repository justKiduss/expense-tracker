'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utilis';

type Props = {
  month: string | null;
  day: string | null;
  all: boolean;
};

export default function ReviewFilters({ month, day, all }: Props) {
  const router = useRouter();
  const thisMonthActive = !all && !day && month !== null;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-neutral-400">
        <span className="mb-1 block">Month</span>
        <input
          key={`m-${month ?? 'none'}`}
          type="month"
          defaultValue={month ?? ''}
          onChange={(e) => e.target.value && router.push(`/review?month=${e.target.value}`)}
          className={cn(
            'rounded-lg border bg-app px-3 py-2 text-sm text-neutral-100',
            thisMonthActive ? 'border-emerald-500' : 'border-line',
          )}
        />
      </label>

      <label className="text-xs text-neutral-400">
        <span className="mb-1 block">Day</span>
        <input
          key={`d-${day ?? 'none'}`}
          type="date"
          defaultValue={day ?? ''}
          onChange={(e) => e.target.value && router.push(`/review?day=${e.target.value}`)}
          className={cn(
            'rounded-lg border bg-app px-3 py-2 text-sm text-neutral-100',
            day ? 'border-emerald-500' : 'border-line',
          )}
        />
      </label>

      <button
        type="button"
        onClick={() => router.push('/review?month=all')}
        className={cn(
          'rounded-lg border px-3 py-2 text-sm',
          all ? 'border-emerald-500 text-emerald-400' : 'border-line text-neutral-300 hover:bg-panel',
        )}
      >
        All time
      </button>

      <button
        type="button"
        onClick={() => router.push('/review')}
        className="rounded-lg border border-line px-3 py-2 text-sm text-neutral-300 hover:bg-panel"
      >
        This month
      </button>
    </div>
  );
}