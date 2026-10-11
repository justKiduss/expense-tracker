import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { devices, pairingCodes } from '@/lib/db/schema';
import { hashToken, newDeviceToken, newPairingCode } from '@/lib/auth/device';

const CODE_TTL_MS = 10 * 60 * 1000;

export async function createPairingCode(userId: string) {
  const code = newPairingCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await db.insert(pairingCodes).values({ userId, codeHash: hashToken(code), expiresAt });
  return { code, expiresAt };
}

/** Returns the device token (shown once), or null if the code is wrong, used or expired. */
export async function pairDevice(code: string, deviceName: string) {
  // one atomic update, so a code can only be claimed once even with two simultaneous requests
  const [claimed] = await db
    .update(pairingCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(pairingCodes.codeHash, hashToken(code)), isNull(pairingCodes.usedAt), gt(pairingCodes.expiresAt, new Date())))
    .returning({ userId: pairingCodes.userId });
  if (!claimed) return null;

  const token = newDeviceToken();
  await db.insert(devices).values({ userId: claimed.userId, name: deviceName, tokenHash: hashToken(token) });
  return token;
}

export async function authenticateDevice(token: string) {
  const [d] = await db
    .select({ id: devices.id, userId: devices.userId })
    .from(devices)
    .where(and(eq(devices.tokenHash, hashToken(token)), isNull(devices.revokedAt)))
    .limit(1);
  if (!d) return null;
  await db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, d.id));
  return d;
}

export async function listDevices(userId: string) {
  return db
    .select({ id: devices.id, name: devices.name, createdAt: devices.createdAt, lastSeenAt: devices.lastSeenAt, revokedAt: devices.revokedAt })
    .from(devices)
    .where(eq(devices.userId, userId))
    .orderBy(desc(devices.createdAt));
}

export async function revokeDevice(userId: string, id: string) {
  const [row] = await db
    .update(devices)
    .set({ revokedAt: new Date() })
    .where(and(eq(devices.id, id), eq(devices.userId, userId), isNull(devices.revokedAt))) // ownership
    .returning({ id: devices.id });
  return row ?? null;
}