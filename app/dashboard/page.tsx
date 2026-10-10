import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { listTransations } from '@/lib/services/transaction.service';
import LogoutButton from '@/components/logout-button';
import ImportForm from '@/components/import-form';
import TransactionList from '@/components/transaction-list';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login'); // the guard

  const items=await listTransations(user.id); // filtered by the logged-in user

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>
      <p className="mt-4">Logged in as {user.email}</p>

      <ImportForm/>
      <TransactionList items={items} />
    </main>
  );
}