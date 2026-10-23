'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/page-header';

export default function OverviewHeader({ userName, month }: { userName: string; month: string }) {
  const router = useRouter();
  return (
    <PageHeader
      userName={userName}
      month={month}
      onMonthChange={(m) => router.push(`/?month=${m}`)}
      onAddTransaction={() => {}} // manual add comes later
      onSearchClick={() => {}}
    />
  );
}