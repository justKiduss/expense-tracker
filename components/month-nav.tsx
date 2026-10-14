import Link from 'next/link';

interface Props {
  label: string;
  prev: string;
  next: string | null;
  isCurrent: boolean;
}

export default function MonthNav({ label, prev, next, isCurrent }: Props) {
  return (
    <nav className="mt-6 flex items-center justify-between gap-2" aria-label="Month">
      <Link href={`/dashboard?month=${prev}`} className="btn" aria-label="Previous month">←</Link>
      <div className="text-center">
        <p className="font-medium">{label}</p>
        {!isCurrent && (
          <Link href="/dashboard" className="text-xs underline opacity-80">Back to this month</Link>
        )}
      </div>
      {next ? (
        <Link href={`/dashboard?month=${next}`} className="btn" aria-label="Next month">→</Link>
      ) : (
        <span className="btn pointer-events-none opacity-30" aria-hidden="true">→</span>
      )}
    </nav>
  );
}