import { formatBirr } from '@/lib/format';
import BudgetInput from './budget-input';

// daysLeft is null for past months: there is nothing left to spread over.
export default function BudgetPanel({ limit, spent, daysLeft }: { limit: number | null; spent: number; daysLeft: number | null }) {
  const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit !== null && spent > limit;
  const perDay = limit !== null && daysLeft !== null ? Math.round(Math.max(limit - spent, 0) / daysLeft) : 0;

  return (
    <section className="card mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Monthly limit</h2>
        <BudgetInput endpoint="/api/budget" field="monthlyLimit" current={limit} placeholder="Limit (birr)" />
      </div>

      {limit === null ? (
        <p className="mt-2 text-sm opacity-70">Set a limit to see how much you can still spend.</p>
      ) : (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded bg-neutral-800">
            <div className={`h-full ${over ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm">Spent {formatBirr(spent)} of {formatBirr(limit)}</p>
          {over ? (
            <p className="text-sm text-red-400">Over budget by {formatBirr(spent - limit)}</p>
          ) : daysLeft !== null ? (
            <p className="text-sm opacity-80">
              {formatBirr(limit - spent)} left, about {formatBirr(perDay)} per day for the next {daysLeft} day{daysLeft === 1 ? '' : 's'}
            </p>
          ) : (
            <p className="text-sm opacity-80">Under the limit by {formatBirr(limit - spent)}</p>
          )}
        </>
      )}
    </section>
  );
}