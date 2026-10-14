'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatBirr, formatDate } from '@/lib/format';

export interface RowTx {
  id: string;
  direction: 'in' | 'out';
  kind: string;
  amount: number;
  fee: number;
  counterparty: string | null;
  description: string | null;
  occurredAt: string; // ISO string
  needsReview: boolean;
  categoryId: string | null;
  isInternal: boolean;
}

export default function TransactionRow({ tx, categories }: { tx: RowTx; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [categoryId, setCategoryId] = useState(tx.categoryId ?? '');
  const [isInternal, setIsInternal] = useState(tx.isInternal);
  const [error, setError] = useState<string | null>(null);

  function patch(body: object, undo: () => void) {
    setError(null);
    start(async () => {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { undo(); return setError('Could not save'); }
      router.refresh();
    });
  }

  const sign = tx.direction === 'in' ? '+' : '-';
  const amountColor = isInternal ? 'opacity-60' : tx.direction === 'in' ? 'text-green-500' : 'text-red-500';

  return (
    <li className={`flex items-start justify-between gap-4 p-3 ${pending ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <p className="truncate font-medium">{tx.counterparty ?? tx.description ?? tx.kind}</p>
        <p className="text-xs opacity-70">
          {formatDate(new Date(tx.occurredAt))} · {tx.kind}{tx.needsReview && ' · needs review'}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {tx.direction === 'out' && !isInternal && (
            <select
              value={categoryId}
              onChange={(e) => {
                const prev = categoryId;
                setCategoryId(e.target.value);
                patch({ categoryId: e.target.value || null }, () => setCategoryId(prev));
              }}
              className="rounded border p-1 text-xs text-black"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-1 text-xs opacity-80">
            <input
              type="checkbox" checked={isInternal}
              onChange={(e) => {
                const prev = isInternal;
                setIsInternal(e.target.checked);
                patch({ isInternal: e.target.checked }, () => setIsInternal(prev));
              }}
            />
            Exclude from totals
          </label>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>

      <div className="text-right">
        <p className={amountColor}>{sign}{formatBirr(tx.amount)}</p>
        {tx.fee > 0 && <p className="text-xs opacity-70">fee {formatBirr(tx.fee)}</p>}
      </div>
    </li>
  );
}