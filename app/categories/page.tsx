import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import CategoriesCard from '@/components/categories/categories_card';
import { getCurrentUser } from '@/lib/auth/session';
import { listCategories } from '@/lib/services/category.services';

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const userName = user.email.split('@')[0];
  const categories = await listCategories(user.id);

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/categories" userName={userName} userEmail={user.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-neutral-400">Add your own categories and set a monthly budget on each.</p>
        </div>
        <CategoriesCard
          categories={categories.map((c) => ({ id: c.id, name: c.name, monthlyBudget: c.monthlyBudget }))}
        />
      </main>
    </div>
  );
}