import { formatBirr } from '@/lib/format';

interface Props {
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export default function SummaryCards({ label, income, expenses, net }: Props) {
  const card = 'flex-1 rounded border p-3';
  return (
    <section className="mt-6">
      <h2 className="text-sm opacity-70">{label}</h2>
      <div className="mt-2 flex gap-3">
        <div className={card}>
          <p className="text-xs opacity-70">Income</p>
          <p className="text-green-500">{formatBirr(income)}</p>
        </div>
        <div className={card}>
          <p className="text-xs opacity-70">Expenses</p>
          <p className="text-red-500">{formatBirr(expenses)}</p>
        </div>
        <div className={card}>
          <p className="text-xs opacity-70">Net</p>
          <p>{net < 0 ? '-' : ''}{formatBirr(Math.abs(net))}</p>
        </div>
      </div>
    </section>
  );
}