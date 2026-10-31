import { canAccessPath, type StaffRoleName } from '@/lib/access';
import { getPrisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';

export type StaffProfile = {
  id: string;
  fullName: string;
  email: string;
  role: StaffRoleName;
};

export type StaffLookup =
  | { status: 'ok'; staff: StaffProfile }
  | { status: 'anonymous' }
  | { status: 'unassigned' }
  | { status: 'unavailable' };

type Identity = {
  userId: string;
  email: string | null;
};

export async function findStaffByIdentity(identity: Identity): Promise<StaffLookup> {
  try {
    const prisma = getPrisma();
    const linked = await prisma.user.findUnique({
      where: { supabaseUserId: identity.userId },
    });
    const byEmail =
      linked || !identity.email
        ? null
        : await prisma.user.findFirst({
            where: { email: { equals: identity.email, mode: 'insensitive' } },
          });
    const user = linked ?? byEmail;

    if (!user || !user.isActive) {
      return { status: 'unassigned' };
    }

    if (user.supabaseUserId && user.supabaseUserId !== identity.userId) {
      return { status: 'unassigned' };
    }

    if (!user.supabaseUserId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { supabaseUserId: identity.userId },
      });
    }

    if (!isStaffRole(user.role)) {
      return { status: 'unassigned' };
    }

    return {
      status: 'ok',
      staff: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Staff lookup failed', error instanceof Error ? error.name : 'Error');
    return { status: 'unavailable' };
  }
}

export async function requireAccess(pathname: string) {
  const result = await getCurrentStaff();

  if (result.status !== 'ok') {
    redirect(result.status === 'unassigned' ? '/login?reason=unassigned' : '/login');
  }

  if (!canAccessPath(result.staff.role, pathname)) {
    redirect('/');
  }

  return result.staff;
}

export const getCurrentStaff = cache(async (): Promise<StaffLookup> => {
  await connection();
  const identity = await readIdentity();

  if (!identity) {
    return { status: 'anonymous' };
  }

  return findStaffByIdentity(identity);
});

async function readIdentity(): Promise<Identity | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    const userId = typeof data.claims.sub === 'string' ? data.claims.sub : null;
    const email = typeof data.claims.email === 'string' ? data.claims.email : null;

    if (!userId) {
      return null;
    }

    return { userId, email };
  } catch (error) {
    console.error('Session lookup failed', error instanceof Error ? error.name : 'Error');
    return null;
  }
}

function isStaffRole(role: string): role is StaffRoleName {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'RECEPTIONIST' ||
    role === 'DOCTOR' ||
    role === 'NURSE'
  );
}
