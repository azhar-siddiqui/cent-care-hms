'use server';

import { acceptInviteSchema, type AcceptInviteValues } from '@/app/invite/[token]/schema';
import { acceptInvitation } from '@/lib/invites';
import { getCurrentStaff } from '@/lib/staff';
import { getSupabasePublishableEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function acceptInvite(
  input: AcceptInviteValues,
): Promise<{ error: string } | { ready: 'switch' | 'created' }> {
  const parsed = acceptInviteSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const accepted = await acceptInvitation({
    token: parsed.data.token,
    fullName: parsed.data.fullName,
    password: parsed.data.password,
  });

  if (!accepted.ok) {
    return { error: accepted.error };
  }

  const current = await getCurrentStaff();

  if (current.status === 'ok') {
    return { ready: 'switch' };
  }

  if (!getSupabasePublishableEnv()) {
    return { ready: 'created' };
  }

  const supabase = await createClient();
  const signedIn = await supabase.auth.signInWithPassword({
    email: accepted.data.email,
    password: parsed.data.password,
  });

  if (signedIn.error || !signedIn.data.user) {
    return { ready: 'created' };
  }

  redirect('/');
}
