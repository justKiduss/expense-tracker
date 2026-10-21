'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Moon, Search, Sun } from 'lucide-react';

interface AppHeaderProps {
  userName: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  month: string; // 'YYYY-MM', the same value the dashboard uses in ?month=
  onMonthChange: (month: string) => void;
  onSearch: (query: string) => void;
  hasUnread?: boolean;
}

export default function AppHeader({
  userName, theme, onToggleTheme, month, onMonthChange, onSearch, hasUnread = false,
}: AppHeaderProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const initial = userName.trim().charAt(0).toUpperCase() || '?';
  const iconButton =
    'relative flex size-10 items-center justify-center rounded-lg border border-line bg-panel text-neutral-300 hover:bg-white/10';

  // pressing "/" anywhere jumps to the search box, like the hint in the design
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="flex items-center gap-4 border-b border-line bg-app px-6 py-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(query.trim());
        }}
        className="relative max-w-md flex-1"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions, categories..."
          className="w-full rounded-lg border border-line bg-panel py-2.5 pl-9 pr-10 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line px-1.5 text-xs text-neutral-500">/</kbd>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          aria-label="Month"
          className="rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-neutral-100 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button type="button" aria-label="Notifications" className={iconButton}>
          <Bell className="size-5" />
          {hasUnread && <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />}
        </button>
        <button type="button" aria-label="Toggle theme" onClick={onToggleTheme} className={iconButton}>
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}