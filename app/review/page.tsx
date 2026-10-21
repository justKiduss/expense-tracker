import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import ReviewList from '@/components/review/review-list';
import ReviewFilters from '@/components/review/review-filters';
import { getReviewGroups, resolveReviewRange } from '@/lib/services/review.service';
import { listCategories } from '@/lib/services/category.services';
import { getCurrentUser } from '@/lib/auth/session';
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month, day } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const range = resolveReviewRange(month, day);
  const [groups, categories] = await Promise.all([getReviewGroups(user?.id, range), listCategories(user?.id)]);
  const userName = user?.email.split('@')[0];

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/overview" userName={userName} userEmail={user?.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Sort your spending</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Choose a category once. It is applied to all matching payments, in every month, and to future ones.
          </p>
        </div>

        <ReviewFilters month={range.month} day={range.day} all={range.all} />

        <ReviewList groups={groups} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </main>
    </div>
  );
}