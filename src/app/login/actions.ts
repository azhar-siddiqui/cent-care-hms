'use server';

import { loginSchema, type LoginValues } from '@/app/login/schema';
import { findStaffByIdentity } from '@/lib/staff';
import { getSupabasePublishableEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(input: LoginValues): Promise<{ error: string } | void> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: 'Enter your email and password.' };
  }

  if (!getSupabasePublishableEnv()) {
    return { error: 'Sign-in is not configured on this server.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: 'Email or password is wrong.' };
  }

  const staff = await findStaffByIdentity({
    userId: data.user.id,
    email: data.user.email ?? parsed.data.email,
  });

  if (staff.status === 'unavailable') {
    await supabase.auth.signOut();
    return { error: 'The staff record could not be checked. Try again.' };
  }

  if (staff.status !== 'ok') {
    await supabase.auth.signOut();
    return { error: 'This account is not an active staff user.' };
  }

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
