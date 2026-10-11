import type { transations } from '@/lib/db/schema';
import TransactionRow from './transaction-row';

type Tx = typeof transations.$inferSelect;

export default function TransactionList({ items, categories }: { items: Tx[]; categories: { id: string; name: string }[] }) {
  if (items.length === 0) {
    return <p className="mt-6 text-sm opacity-70">No transactions yet. Paste an SMS above.</p>;
  }
  return (
    <ul className="mt-6 divide-y rounded border">
      {items.map((t) => (
        <TransactionRow
          key={t.id}
          categories={categories}
          tx={{
            id: t.id,
            direction: t.direction as 'in' | 'out',
            kind: t.kind,
            amount: t.amount,
            fee: t.fee,
            counterparty: t.counterparty,
            description: t.description,
            occurredAt: t.occurredAt.toISOString(),
            needsReview: t.needsReview,
            categoryId: t.categoryId,
            isInternal: t.isInternal,
          }}
        />
      ))}
    </ul>
  );
}