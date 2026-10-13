import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import AuthForm from '@/components/auth-form';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/dashboard'); // already logged in
  return <AuthForm mode="signup"/>
}