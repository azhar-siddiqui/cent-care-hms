import { createHash, randomBytes } from 'node:crypto';

import { isInvitableRole, type InvitableRole, type StaffRoleName } from '@/lib/access';
import { getPrisma } from '@/lib/prisma';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { connection } from 'next/server';

export const adminSeatLimit = 3;
const inviteLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export type InvitationStatusName = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export type InvitationListItem = {
  id: string;
  email: string;
  role: StaffRoleName;
  status: InvitationStatusName;
  sentOn: string;
  expiresOn: string;
};

export type InviteDeskData = {
  seatsUsed: number;
  seatLimit: number;
  invites: InvitationListItem[];
};

export type AcceptInviteView =
  | { state: 'ready'; email: string; role: InvitableRole }
  | { state: 'closed'; title: string; message: string };

type InviteResult<T> = { ok: true; data: T } | { ok: false; error: string };

const deskDate = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const closedCopy: Record<
  Exclude<InvitationStatusName, 'PENDING'>,
  { title: string; message: string }
> = {
  ACCEPTED: {
    title: 'Invite already used',
    message: 'This account is already on the desk. Sign in with that email.',
  },
  REVOKED: {
    title: 'Invite cancelled',
    message: 'The super admin cancelled this invite. Ask for a new one if you still need access.',
  },
  EXPIRED: {
    title: 'Invite expired',
    message: 'This invite has expired. Ask the super admin to send a new one.',
  },
};

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function loadInviteDesk(): Promise<InviteResult<InviteDeskData>> {
  await connection();

  try {
    const now = new Date();
    const prisma = getPrisma();
    await expireStaleInvites(now);

    const [adminCount, pendingCount, invites] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.adminInvitation.count({ where: { status: 'PENDING', role: 'ADMIN' } }),
      prisma.adminInvitation.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        seatsUsed: adminCount + pendingCount,
        seatLimit: adminSeatLimit,
        invites: invites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          sentOn: deskDate.format(invite.createdAt),
          expiresOn: deskDate.format(invite.expiresAt),
        })),
      },
    };
  } catch (error) {
    console.error('Invite list failed', error instanceof Error ? error.name : 'Error');
    return { ok: false, error: 'Invites could not be loaded. Try again.' };
  }
}

export async function createInvitation(input: {
  email: string;
  role: InvitableRole;
  invitedById: string;
}): Promise<InviteResult<{ path: string; email: string }>> {
  const email = normalizeInviteEmail(input.email);

  if (!isInvitableRole(input.role)) {
    return { ok: false, error: 'Choose a role.' };
  }

  try {
    const now = new Date();
    const prisma = getPrisma();
    await expireStaleInvites(now);

    const inviter = await prisma.user.findUnique({ where: { id: input.invitedById } });

    if (!inviter || !inviter.isActive || inviter.role !== 'SUPER_ADMIN') {
      return { ok: false, error: 'Only the super admin can invite staff.' };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existingUser) {
      return { ok: false, error: 'This email already belongs to a staff account.' };
    }

    const pending = await prisma.adminInvitation.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, status: 'PENDING' },
      select: { id: true },
    });

    if (pending) {
      return {
        ok: false,
        error: 'This email already has a pending invite. Revoke it before sending another.',
      };
    }

    if (input.role === 'ADMIN') {
      const [adminCount, pendingCount] = await Promise.all([
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.adminInvitation.count({ where: { status: 'PENDING', role: 'ADMIN' } }),
      ]);

      if (adminCount + pendingCount >= adminSeatLimit) {
        return {
          ok: false,
          error: 'All 3 admin seats are taken, including pending invites.',
        };
      }
    }

    const token = randomBytes(32).toString('base64url');
    await prisma.adminInvitation.create({
      data: {
        email,
        role: input.role,
        tokenHash: hashInviteToken(token),
        status: 'PENDING',
        invitedById: inviter.id,
        expiresAt: new Date(now.getTime() + inviteLifetimeMs),
      },
    });

    return { ok: true, data: { path: `/invite/${token}`, email } };
  } catch (error) {
    if (isAdminLimitError(error)) {
      return { ok: false, error: 'All 3 admin seats are taken, including pending invites.' };
    }

    console.error('Invite create failed', error instanceof Error ? error.name : 'Error');
    return { ok: false, error: 'The invite could not be saved. Try again.' };
  }
}

export async function revokeInvitation(id: string): Promise<InviteResult<{ id: string }>> {
  try {
    const prisma = getPrisma();
    const updated = await prisma.adminInvitation.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });

    if (updated.count !== 1) {
      return { ok: false, error: 'That invite is no longer pending.' };
    }

    return { ok: true, data: { id } };
  } catch (error) {
    console.error('Invite revoke failed', error instanceof Error ? error.name : 'Error');
    return { ok: false, error: 'The invite could not be revoked. Try again.' };
  }
}

export async function readAcceptInvite(token: string): Promise<AcceptInviteView> {
  await connection();
  const hashed = hashIfPresentable(token);

  if (!hashed) {
    return invalidInvite();
  }

  try {
    const now = new Date();
    const prisma = getPrisma();
    const invite = await prisma.adminInvitation.findUnique({
      where: { tokenHash: hashed },
      select: { id: true, email: true, role: true, status: true, expiresAt: true },
    });

    if (!invite) {
      return invalidInvite();
    }

    if (invite.status === 'PENDING' && invite.expiresAt <= now) {
      await prisma.adminInvitation.updateMany({
        where: { id: invite.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
      return { state: 'closed', ...closedCopy.EXPIRED };
    }

    if (invite.status !== 'PENDING') {
      return { state: 'closed', ...closedCopy[invite.status] };
    }

    if (!isInvitableRole(invite.role)) {
      return {
        state: 'closed',
        title: 'Invite unavailable',
        message: 'This invite role is not valid. Ask the super admin to send a new one.',
      };
    }

    return { state: 'ready', email: invite.email, role: invite.role };
  } catch (error) {
    console.error('Invite lookup failed', error instanceof Error ? error.name : 'Error');
    return {
      state: 'closed',
      title: 'Invite unavailable',
      message: 'This invite could not be checked. Try the link again in a moment.',
    };
  }
}

export async function acceptInvitation(input: {
  token: string;
  fullName: string;
  password: string;
}): Promise<InviteResult<{ email: string }>> {
  const hashed = hashIfPresentable(input.token);

  if (!hashed) {
    return { ok: false, error: 'This invite link is not valid.' };
  }

  const supabase = getServiceRoleClient();

  if (!supabase) {
    return { ok: false, error: 'Staff sign-up is not configured on this server.' };
  }

  let createdAuthUserId: string | null = null;

  try {
    const now = new Date();
    const prisma = getPrisma();
    const invite = await prisma.adminInvitation.findUnique({
      where: { tokenHash: hashed },
    });

    if (!invite) {
      return { ok: false, error: 'This invite link is not valid.' };
    }

    if (invite.status === 'PENDING' && invite.expiresAt <= now) {
      await prisma.adminInvitation.updateMany({
        where: { id: invite.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
      return { ok: false, error: closedCopy.EXPIRED.message };
    }

    if (invite.status !== 'PENDING') {
      return { ok: false, error: closedCopy[invite.status].message };
    }

    if (!isInvitableRole(invite.role)) {
      return { ok: false, error: 'This invite role is not valid.' };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: invite.email, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existingUser) {
      return {
        ok: false,
        error:
          'This email already belongs to a staff account. Ask the super admin to revoke the invite.',
      };
    }

    if (invite.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });

      if (adminCount >= adminSeatLimit) {
        return { ok: false, error: 'The hospital already has 3 admins.' };
      }
    }

    const created = await supabase.auth.admin.createUser({
      email: invite.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: invite.role },
    });

    if (created.error || !created.data.user) {
      return { ok: false, error: authCreateMessage(created.error?.message) };
    }

    createdAuthUserId = created.data.user.id;

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: invite.email,
          fullName: input.fullName,
          role: invite.role,
          supabaseUserId: created.data.user.id,
        },
      });

      const accepted = await tx.adminInvitation.updateMany({
        where: { id: invite.id, status: 'PENDING' },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      if (accepted.count !== 1) {
        throw new Error('INVITE_CLOSED');
      }
    });

    return { ok: true, data: { email: invite.email } };
  } catch (error) {
    if (createdAuthUserId) {
      const removed = await supabase.auth.admin.deleteUser(createdAuthUserId);

      if (removed.error) {
        console.error('Invite auth rollback failed', removed.error.name);
      }
    }

    if (errorText(error).includes('INVITE_CLOSED')) {
      return { ok: false, error: 'This invite was already used.' };
    }

    if (isAdminLimitError(error)) {
      return { ok: false, error: 'The hospital already has 3 admins.' };
    }

    console.error('Invite accept failed', error instanceof Error ? error.name : 'Error');
    return { ok: false, error: 'The account could not be created. Try again.' };
  }
}

async function expireStaleInvites(now: Date) {
  const prisma = getPrisma();
  await prisma.adminInvitation.updateMany({
    where: { status: 'PENDING', expiresAt: { lte: now } },
    data: { status: 'EXPIRED' },
  });
}

function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function hashIfPresentable(token: string) {
  const trimmed = token.trim();

  if (trimmed.length < 20 || trimmed.length > 200) {
    return null;
  }

  return hashInviteToken(trimmed);
}

function invalidInvite(): AcceptInviteView {
  return {
    state: 'closed',
    title: 'Invite link is not valid',
    message: 'Check the link with the super admin and ask for a new invite if it is missing.',
  };
}

function authCreateMessage(message: string | undefined) {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('already') || normalized.includes('registered')) {
    return 'This email is already registered for sign-in. Ask the super admin to use a different email.';
  }

  if (normalized.includes('password')) {
    return 'Use a stronger password and try again.';
  }

  return 'The account could not be created. Try again.';
}

function isAdminLimitError(error: unknown) {
  return errorText(error).includes('Additional admin limit reached');
}

function errorText(error: unknown) {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);

    if ('message' in current && typeof current.message === 'string') {
      parts.push(current.message);
    }

    current = 'cause' in current ? current.cause : undefined;
  }

  return parts.join(' ');
}
