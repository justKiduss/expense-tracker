import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import ReviewList from '@/components/review/review-list';
import { getReviewGroups } from '@/lib/services/review.service';
import { listCategories } from '@/lib/services/category.services';
import { getCurrentUser } from '@/lib/auth/session';
export default async function ReviewPage() {
  // --- AUTH: same lines as in app/overview/page.tsx (must leave `userId` and `email`) ---
  // ---------------------------------------------------------------------------------------
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [groups, categories] = await Promise.all([getReviewGroups(user?.id), listCategories(user?.id)]);
  const userName = user?.email.split('@')[0];

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/overview" userName={userName} userEmail={user?.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Sort your spending</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Choose a category once. It is applied to all matching payments, past and future. This covers all months.
          </p>
        </div>
        <ReviewList groups={groups} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </main>
    </div>
  );
}