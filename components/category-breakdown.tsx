import { formatBirr } from '@/lib/format';
import BudgetInput from './budget-input';
import AddCategoryForm from './add-category-form';

type Cat = { id: string; name: string; monthlyBudget: number | null };

export default function CategoryBreakdown({
  categories,
  breakdown,
}: {
  categories: Cat[];
  breakdown: { categoryId: string | null; spent: number }[];
}) {
  const spentBy = new Map(breakdown.map((b) => [b.categoryId, b.spent]));
  const uncategorized = spentBy.get(null) ?? 0;

  const rows = categories
    .map((c) => ({ ...c, spent: spentBy.get(c.id) ?? 0 }))
    .filter((r) => r.spent > 0 || r.monthlyBudget !== null)
    .sort((a, b) => b.spent - a.spent);

  const max = Math.max(1, uncategorized, ...rows.map((r) => r.spent));

  return (
    <section className="mt-6">
      <h2 className="font-medium">Where your money went</h2>

      <div className="card mt-2 space-y-4">
        {uncategorized === 0 && rows.length === 0 && (
          <p className="text-sm opacity-70">No spending yet this month.</p>
        )}

        {uncategorized > 0 && (
          <div>
            <div className="flex justify-between text-sm">
              <span>Uncategorized</span>
              <span>{formatBirr(uncategorized)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-neutral-800">
              <div className="h-full bg-neutral-500" style={{ width: `${(uncategorized / max) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs opacity-60">Pick a category on the transactions below.</p>
          </div>
        )}

        {rows.map((r) => {
          const over = r.monthlyBudget !== null && r.spent > r.monthlyBudget;
          const near = r.monthlyBudget !== null && r.spent >= r.monthlyBudget * 0.8;
          const pct = r.monthlyBudget ? Math.min(100, (r.spent / r.monthlyBudget) * 100) : (r.spent / max) * 100;
          return (
            <div key={r.id}>
              <div className="flex justify-between text-sm">
                <span>{r.name}</span>
                <span className={over ? 'text-red-400' : ''}>
                  {formatBirr(r.spent)}
                  {r.monthlyBudget !== null && ` / ${formatBirr(r.monthlyBudget)}`}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-neutral-800">
                <div className={`h-full ${over ? 'bg-red-500' : near ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm opacity-80">Manage categories and budgets</summary>
        <ul className="mt-3 space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">{c.name}</span>
              <BudgetInput endpoint={`/api/categories/${c.id}`} field="monthlyBudget" current={c.monthlyBudget} />
            </li>
          ))}
        </ul>
        <AddCategoryForm />
      </details>
    </section>
  );
}