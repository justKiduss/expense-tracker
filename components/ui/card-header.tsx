import Link from 'next/link';

export function CardHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-emerald-400 hover:underline">
          View all
        </Link>
      )}
    </div>
  );
}