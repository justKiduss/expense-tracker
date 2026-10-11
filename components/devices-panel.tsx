'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';

export interface DeviceRow {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
}

export default function DevicesPanel({ devices }: { devices: DeviceRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const res = await fetch('/api/devices/pairing-code', { method: 'POST' });
      if (!res.ok) return setError('Could not create a code');
      const data = await res.json();
      setCode(data.code);
    });
  }

  function revoke(id: string) {
    if (!confirm('Revoke this phone? It will stop syncing.')) return;
    setError(null);
    start(async () => {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (!res.ok) return setError('Could not revoke');
      router.refresh();
    });
  }

  return (
    <section className="card mt-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Phones</h2>
        <button onClick={generate} disabled={pending} className="btn">Pair a new phone</button>
      </div>

      {code && (
        <div className="mt-3 rounded-md border border-neutral-700 p-3">
          <p className="text-xs opacity-70">Enter this code in the app. It works once and expires in 10 minutes.</p>
          <p className="mt-1 text-2xl font-semibold tracking-widest">{code}</p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {devices.length === 0 ? (
        <p className="mt-3 text-sm opacity-70">No phones paired yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-800">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-2">
              <div>
                <p className={`text-sm ${d.revokedAt ? 'line-through opacity-50' : ''}`}>{d.name}</p>
                <p className="text-xs opacity-60">
                  {d.revokedAt
                    ? 'Revoked'
                    : d.lastSeenAt
                      ? `Last seen ${formatDate(new Date(d.lastSeenAt))}`
                      : 'Never synced'}
                </p>
              </div>
              {!d.revokedAt && (
                <button onClick={() => revoke(d.id)} disabled={pending} className="btn">Revoke</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}