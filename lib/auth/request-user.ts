import { getCurrentUser } from '@/lib/auth/session';
import { authenticateDevice } from '@/lib/services/device.service';

export async function getRequestUser(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const device = await authenticateDevice(auth.slice(7));
    return device ? { id: device.userId } : null;
  }
  const user = await getCurrentUser();
  return user ? { id: user.id } : null;
}