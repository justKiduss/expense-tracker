'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';
import BudgetInput from '@/components/budget-input';

type Cat = { id: string; name: string; monthlyBudget: number | null };

export default function CategoriesCard({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    const clean = name.trim();
    if (!clean) return setError('Type a name first');
    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      return setError('You already have this category');
    }
    setError(null);
    start(async () => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });
      if (!res.ok) return setError('Could not add the category');
      setName('');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader title="Categories" />
      <p className="mt-1 text-sm text-neutral-400">
        Add your own, for example Pool or Church. Set a monthly budget on any of them (leave empty for none).
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="New category name"
          aria-label="New category name"
          maxLength={40}
          className="w-56 rounded-lg border border-line bg-app px-3 py-2 text-sm text-neutral-100"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? '...' : 'Add'}
        </button>
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>

      <ul className="mt-4 divide-y divide-line">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <span className="text-sm text-neutral-100">{c.name}</span>
            <BudgetInput endpoint={`/api/categories/${c.id}`} field="monthlyBudget" current={c.monthlyBudget} />
          </li>
        ))}
      </ul>
    </Card>
  );
}