'use client';

import { useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Info, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

function subscribe() {
  return () => {};
}

function readPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
}

// The server cannot know the device, so it renders 'unknown' first.
function serverPlatform(): Platform {
  return 'unknown';
}

function Steps() {
  return (
    <ol className="mt-4 space-y-3 text-sm text-neutral-300">
      <li className="flex gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
          1
        </span>
        <span>
          Download the app and open the file. If Android asks, allow your browser to{' '}
          <strong className="font-medium text-neutral-100">install unknown apps</strong>.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
          2
        </span>
        <span>
          Open the app and allow <strong className="font-medium text-neutral-100">SMS</strong> access. The app reads
          only CBE and telebirr messages.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
          3
        </span>
        <span>
          Generate an <strong className="font-medium text-neutral-100">8-digit pairing code</strong> on this website
          and type it in the app.
        </span>
      </li>
    </ol>
  );
}

function RestrictedNote() {
  return (
    <div className="mt-4 flex gap-2 rounded-lg border border-line bg-app p-3 text-xs text-neutral-400">
      <Info className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
      <p>
        <span className="text-neutral-200">Android 13 or newer:</span> if SMS permission is greyed out, open{' '}
        <span className="text-neutral-200">Settings, Apps, ExpenseTracker</span>, tap the ⋮ menu at the top right and
        choose <span className="text-neutral-200">Allow restricted settings</span>. Then allow SMS again.
      </p>
    </div>
  );
}

export default function InstallAppCard({ apkUrl }: { apkUrl: string }) {
  const platform = useSyncExternalStore(subscribe, readPlatform, serverPlatform);

  return (
    <Card>
      <CardHeader title="Install the Android app" />

      {platform === 'unknown' && <p className="mt-4 text-sm text-neutral-500">Checking your device...</p>}

      {platform === 'ios' && (
        <div className="mt-4 flex gap-3 text-sm text-neutral-300">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-neutral-400" aria-hidden="true" />
          <p>
            iPhone does not allow apps to read SMS messages, so the automatic sync is not available on iOS. You can
            still use this website to look at your data. To sync, you need an Android phone.
          </p>
        </div>
      )}

      {platform === 'android' && (
        <>
          {apkUrl ? (
            <a
              href={apkUrl}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
            >
              <Download className="size-4" aria-hidden="true" />
              Download Android app
            </a>
          ) : (
            <p className="mt-4 text-sm text-amber-400">The download link is not set yet.</p>
          )}
          <Steps />
          <RestrictedNote />
        </>
      )}

      {platform === 'desktop' && (
        <>
          <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row">
            {apkUrl ? (
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={apkUrl} size={144} bgColor="#ffffff" fgColor="#000000" />
              </div>
            ) : (
              <p className="text-sm text-amber-400">The download link is not set yet.</p>
            )}
            <p className="max-w-xs text-sm text-neutral-300">
              Scan this code with the camera of your <strong className="font-medium text-neutral-100">Android phone</strong>.
              It starts the download there. The app only works on Android.
            </p>
          </div>
          <Steps />
          <RestrictedNote />
        </>
      )}
    </Card>
  );
}