'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function AddCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.status === 409) return setError('That category already exists');
      if (!res.ok) return setError('Could not add category');
      setName('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={add} className="mt-3 flex items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category (e.g. Pool)" maxLength={40} required className="rounded border p-1 text-xs text-black" />
      <button disabled={pending} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Add</button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  );
}