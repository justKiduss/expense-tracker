import { Info, Landmark, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';
import { formatCurrency } from '@/lib/format-currency';

export interface AccountItem {
  id: string;
  name: string; // 'CBE', 'telebirr'
  kind: 'bank' | 'wallet';
  balanceCents: number | null; // null = no balance seen yet
  asOf?:string;
}

export default function AccountsCard({
  accounts,
  internalTransfersExcluded = 0,
}: {
  accounts: AccountItem[];
  internalTransfersExcluded?: number;
}) {
  const known = accounts.filter((a) => a.balanceCents !== null);
  const total = known.reduce((sum, a) => sum + (a.balanceCents ?? 0), 0);

  return (
    <Card className="h-full">
      <CardHeader title="Your accounts" />

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No accounts yet. Pair your phone to start.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {accounts.map((a) => {
            const Icon = a.kind === 'bank' ? Landmark : Smartphone;
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <span className="flex items-center gap-3 text-sm text-neutral-100">
                  <Icon className="size-5 text-neutral-400" aria-hidden="true" />
                  <span>
                    {a.name}
                    {a.asOf && (
                      <span className="block text-xs text-neutral-500">
                        as of{' '}
                        {new Date(a.asOf).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'Africa/Addis_Ababa',
                        })}
                      </span>
                    )}
                  </span>
                </span>
                {a.balanceCents === null ? (
                  <span className="text-xs text-neutral-500">No balance yet</span>
                ) : (
                  <span className="text-sm font-semibold text-white">ETB {formatCurrency(a.balanceCents)}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {known.length > 0 && (
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-neutral-400">Total (latest known)</span>
          <span className="text-base font-semibold text-white">ETB {formatCurrency(total)}</span>
        </div>
      )}

      {internalTransfersExcluded > 0 && (
        <p className="mt-3 flex items-start gap-2 text-xs text-neutral-500">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {internalTransfersExcluded} transfer{internalTransfersExcluded === 1 ? '' : 's'} between your accounts excluded
          from spending totals.
        </p>
      )}
    </Card>
  );
}