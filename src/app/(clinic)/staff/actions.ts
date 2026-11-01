'use server';

import { inviteSchema, type InviteValues } from '@/app/(clinic)/staff/invite-schema';
import { createInvitation, revokeInvitation } from '@/lib/invites';
import { getCurrentStaff } from '@/lib/staff';
import { revalidatePath } from 'next/cache';

const inviteIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function sendInvite(
  input: InviteValues,
): Promise<{ error: string } | { path: string; email: string }> {
  const staff = await requireSuperAdmin();

  if (!staff) {
    return { error: 'Only the super admin can invite staff.' };
  }

  const parsed = inviteSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the invite and try again.' };
  }

  const created = await createInvitation({
    email: parsed.data.email,
    role: parsed.data.role,
    invitedById: staff.id,
  });

  if (!created.ok) {
    return { error: created.error };
  }

  revalidatePath('/staff/invites');

  return created.data;
}

export async function revokeInvite(id: string): Promise<{ error: string } | void> {
  const staff = await requireSuperAdmin();

  if (!staff) {
    return { error: 'Only the super admin can revoke invites.' };
  }

  if (!inviteIdPattern.test(id)) {
    return { error: 'That invite could not be found.' };
  }

  const revoked = await revokeInvitation(id);

  if (!revoked.ok) {
    return { error: revoked.error };
  }

  revalidatePath('/staff/invites');
}

async function requireSuperAdmin() {
  const result = await getCurrentStaff();

  if (result.status !== 'ok' || result.staff.role !== 'SUPER_ADMIN') {
    return null;
  }

  return result.staff;
}
