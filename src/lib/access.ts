import { navSections, type NavSection } from '@/lib/navigation';

export const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] as const;

export type StaffRoleName = (typeof staffRoles)[number];

export const roleLabels: Record<StaffRoleName, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  RECEPTIONIST: 'Receptionist',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
};

const appPaths = ['/', '/opd', '/ipd', '/billing', '/inventory', '/expenses', '/staff'] as const;

const rolePaths: Record<StaffRoleName, readonly string[]> = {
  SUPER_ADMIN: appPaths,
  ADMIN: appPaths,
  RECEPTIONIST: ['/', '/opd', '/ipd', '/billing'],
  DOCTOR: ['/', '/opd', '/ipd'],
  NURSE: ['/', '/opd', '/ipd', '/billing'],
};

export function isAppPath(pathname: string) {
  return appPaths.some((path) => matchesPath(pathname, path));
}

export function canAccessPath(role: StaffRoleName, pathname: string) {
  return rolePaths[role].some((path) => matchesPath(pathname, path));
}

export function navSectionsForRole(role: StaffRoleName): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(role, item.href)),
    }))
    .filter((section) => section.items.length > 0);
}

function matchesPath(pathname: string, path: string) {
  if (path === '/') {
    return pathname === '/';
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}
