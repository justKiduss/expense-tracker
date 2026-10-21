import Link from 'next/link';
import { ChevronRight, Smartphone, Tag } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn, isOlderThanHours, timeAgo } from '@/lib/utilis';

// Full class names on purpose (Tailwind needs them written out)
const TONES = {
  amber: { box: 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10', accent: 'text-amber-400' },
  green: { box: 'border-line bg-panel hover:bg-emerald-500/5', accent: 'text-emerald-400' },
  grey: { box: 'border-line bg-panel hover:bg-white/5', accent: 'text-neutral-300' },
} as const;

function StripCard({
  href,
  tone,
  Icon,
  title,
  subtitle,
  action,
}: {
  href: string;
  tone: keyof typeof TONES;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  action: string;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className={cn('flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors', t.box)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={cn('size-6 shrink-0', t.accent)} aria-hidden="true" />
        <div className="min-w-0">
          <p className={cn('truncate text-sm font-medium', t.accent)}>{title}</p>
          {/* the time text can differ by a minute between server and browser */}
          <p className="truncate text-xs text-neutral-400" suppressHydrationWarning>
            {subtitle}
          </p>
        </div>
      </div>
      <span className={cn('flex shrink-0 items-center gap-1 text-xs font-medium', t.accent)}>
        {action}
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

export interface AttentionStripProps {
  needsCategoryCount: number;
  lastSyncedAt: string | null; // ISO string, null = no phone has ever synced
  newMessagesToday: number;
  reviewHref?: string;
  syncHref?: string;
}

export default function AttentionStrip({
  needsCategoryCount: n,
  lastSyncedAt,
  newMessagesToday,
  reviewHref = '/transactions?filter=uncategorised',
  syncHref = '/settings',
}: AttentionStripProps) {
  const sync =
    lastSyncedAt === null
      ? {
          tone: 'grey' as const,
          title: 'No phone connected',
          subtitle: 'Pair your phone to start reading messages.',
          action: 'Pair phone',
        }
      : {
          tone: isOlderThanHours(lastSyncedAt, 24) ? ('amber' as const) : ('green' as const),
          title: isOlderThanHours(lastSyncedAt, 24) ? 'Sync is behind' : 'Phone synced',
          subtitle: `Last sync ${timeAgo(lastSyncedAt)} · ${newMessagesToday} new message${newMessagesToday === 1 ? '' : 's'} today`,
          action: 'Manage',
        };

  return (
    <section aria-label="Needs attention" className="grid gap-4 md:grid-cols-2">
      {n > 0 ? (
        <StripCard
          href={reviewHref}
          tone="amber"
          Icon={Tag}
          title={`${n} transaction${n === 1 ? '' : 's'} ${n === 1 ? 'needs' : 'need'} a category`}
          subtitle="Tap to sort them in one go"
          action="Review now"
        />
      ) : (
        <StripCard
          href="/transactions"
          tone="green"
          Icon={Tag}
          title="All caught up"
          subtitle="Every transaction has a category"
          action="View transactions"
        />
      )}
      <StripCard href={syncHref} Icon={Smartphone} {...sync} />
    </section>
  );
}