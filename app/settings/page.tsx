import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import InstallAppCard from '@/components/settings/install-add-card';
import { getCurrentUser } from '@/lib/auth/session';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const userName = user.email.split('@')[0];

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/settings" userName={userName} userEmail={user.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-neutral-400">Connect your phone so new messages arrive automatically.</p>
        </div>

        <InstallAppCard apkUrl={process.env.APK_URL ?? ''} />

        <p className="text-xs text-neutral-500">
          Your messages stay on your phone. The app sends only the amount, date, balance and name from CBE and telebirr
          messages.
        </p>
      </main>
    </div>
  );
}