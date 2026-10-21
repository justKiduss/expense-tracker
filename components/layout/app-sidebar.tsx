'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight, ChartNoAxesCombined, ChevronDown, CreditCard, House, Settings, Tag, Target, Trophy, Wallet,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '/dashboard', Icon: House },
  { label: 'Transactions', href: '/transactions', Icon: ArrowLeftRight },
  { label: 'Budgets', href: '/budgets', Icon: Target },
  { label: 'Reports', href: '/reports', Icon: ChartNoAxesCombined },
  { label: 'Goals', href: '/goals', Icon: Trophy },
];

const settings = [
  { label: 'Categories', href: '/categories', Icon: Tag },
  { label: 'Accounts', href: '/accounts', Icon: CreditCard },
  { label: 'Settings', href: '/settings', Icon: Settings },
];

interface AppSidebarProps {
  userName: string;
  userEmail: string;
  activeHref?: string; // lets the preview page pretend to be on a page; the real app leaves it empty
}

export default function AppSidebar({ userName, userEmail, activeHref }: AppSidebarProps) {
  const pathname = usePathname();
  const current = activeHref ?? pathname;
  const initial = userName.trim().charAt(0).toUpperCase() || '?';

  const link = (href: string) => {
    const active = current === href || current.startsWith(href + '/');
    return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      active ? 'bg-brand font-medium text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
    }`;
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-app px-4 py-6 md:flex">
      {/* logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
          <Wallet size={20} aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold text-white">ExpenseTracker</span>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Main navigation">
        {navigation.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={link(href)}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <p className="px-3 pb-2 pt-8 text-xs font-medium tracking-wider text-neutral-500">SETTINGS</p>
      <nav className="flex flex-col gap-1" aria-label="Settings">
        {settings.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={link(href)}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* pinned to the bottom */}
      <div className="mt-auto space-y-4">
        <div className="rounded-xl border border-line bg-panel p-4">
          <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Target size={16} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold leading-snug text-white">Better money habits. A brighter future.</p>
          <p className="mt-3 text-xs text-brand">Track · Plan · Grow</p>
        </div>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-xs text-neutral-500">{userEmail}</p>
          </div>
          <ChevronDown size={16} className="text-neutral-500" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}