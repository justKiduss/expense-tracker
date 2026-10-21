import { formatCurrency } from '@/lib/format-currency';
import type { DetailRow } from '@/lib/services/spending-detail.service';

type Props = { rows: DetailRow[]; categoryNames: Record<string, string> };

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Addis_Ababa',
  });
}

export default function TransactionsTable({ rows, categoryNames }: Props) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-line bg-panel p-5 text-sm text-neutral-400">No spending here.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs text-neutral-500">
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Account</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Amount (ETB)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-neutral-300">{when(r.occurredAt)}</td>
              <td className="px-4 py-3">
                <p className="text-neutral-100">{r.title}</p>
                <p className="text-xs text-neutral-500">{r.feeOnly ? 'Fee only (own transfer)' : r.kindLabel}</p>
              </td>
              <td className="px-4 py-3 text-neutral-300">{r.account}</td>
              <td className="px-4 py-3">
                {r.categoryId ? (
                  <span className="text-neutral-300">{categoryNames[r.categoryId] ?? 'Unknown'}</span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                    Uncategorised
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <p className="text-neutral-100">{formatCurrency(r.countedCents)}</p>
                {!r.feeOnly && r.feeCents > 0 && (
                  <p className="text-xs text-neutral-500">incl. {formatCurrency(r.feeCents)} fee</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}