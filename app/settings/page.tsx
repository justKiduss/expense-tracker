import { redirect } from 'next/navigation';
import AppSidebar from '@/components/layout/app-sidebar';
import InstallAppCard from '@/components/settings/install-add-card';
import DevicesPanel from '@/components/devices-panel';
import ImportForm from '@/components/import-form';
import { getCurrentUser } from '@/lib/auth/session';
import { listDevices } from '@/lib/services/device.service';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const userName = user.email.split('@')[0];

  const devices = await listDevices(user.id);

  return (
    <div className="flex min-h-screen bg-app text-neutral-100">
      <AppSidebar activeHref="/settings" userName={userName} userEmail={user.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-neutral-400">Connect your phone so new messages arrive automatically.</p>
        </div>

        <InstallAppCard apkUrl={process.env.APK_URL ?? ''} />

        <DevicesPanel
          devices={devices.map((d) => ({
            id: d.id,
            name: d.name,
            createdAt: d.createdAt.toISOString(),
            lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
            revokedAt: d.revokedAt?.toISOString() ?? null,
          }))}
        />

        <section>
          <h2 className="text-lg font-semibold">Import messages by pasting</h2>
          <ImportForm />
        </section>

        <p className="text-xs text-neutral-500">
          Your messages stay on your phone. The app sends only the amount, date, balance and name from CBE and telebirr
          messages.
        </p>
      </main>
    </div>
  );
}