'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function BudgetInput({
  endpoint, field, current, placeholder = 'Budget (birr)',
}: { endpoint: string; field: string; current: number | null; placeholder?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current === null ? '' : String(current / 100));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const trimmed = value.trim();
    let cents: number | null = null; // empty = remove the budget
    if (trimmed !== '') {
      const n = Number(trimmed.replace(/,/g, ''));
      if (!Number.isFinite(n) || n < 0) return setError('Enter a valid amount');
      cents = Math.round(n * 100);
    }
    setError(null);
    start(async () => {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: cents }),
      });
      if (!res.ok) return setError('Could not save');
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder={placeholder}
        className="w-28 rounded border p-1 text-xs text-white"
      />
      <button onClick={save} disabled={pending} className="rounded border px-2 py-1 text-xs disabled:opacity-50">
        {pending ? '...' : 'Save'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  );
}