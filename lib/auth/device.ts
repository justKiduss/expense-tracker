import { createHash, randomBytes, randomInt } from 'node:crypto';

export const hashToken = (s: string) => createHash('sha256').update(s).digest('hex');
export const newDeviceToken = () => randomBytes(32).toString('base64url');
export const newPairingCode = () => randomInt(0, 100_000_000).toString().padStart(8, '0');