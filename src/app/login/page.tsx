import { LoginForm } from '@/app/login/login-form';
import { getCurrentStaff } from '@/lib/staff';
import { getSupabasePublishableEnv } from '@/lib/supabase/env';
import { redirect } from 'next/navigation';

export const instant = false;

export const metadata = {
  title: 'Sign in',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const staff = await getCurrentStaff();

  if (staff.status === 'ok') {
    redirect('/');
  }

  const params = await searchParams;

  return (
    <LoginForm
      configured={Boolean(getSupabasePublishableEnv())}
      reason={
        params.reason === 'unassigned' || staff.status === 'unassigned' ? 'unassigned' : undefined
      }
    />
  );
}
