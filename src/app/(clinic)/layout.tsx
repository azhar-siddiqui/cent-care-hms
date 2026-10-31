import { AppShell } from '@/components/shell/app-shell';
import { canAccessPath, navSectionsForRole } from '@/lib/access';
import { getCurrentStaff } from '@/lib/staff';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const instant = false;

export default async function ClinicLayout({ children }: LayoutProps<'/'>) {
  const result = await getCurrentStaff();

  if (result.status === 'anonymous') {
    redirect('/login');
  }

  if (result.status === 'unassigned') {
    redirect('/login?reason=unassigned');
  }

  if (result.status === 'unavailable') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
        <section className="max-w-md rounded-lg border border-destructive/30 bg-card px-5 py-8 shadow-sm">
          <h1 className="text-sm font-medium">Staff record unavailable</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            The desk could not confirm this account. Refresh the page and try again.
          </p>
        </section>
      </main>
    );
  }

  const headerList = await headers();
  const pathname = headerList.get('x-centcare-path') ?? '/';

  if (pathname !== '/' && !canAccessPath(result.staff.role, pathname)) {
    redirect('/');
  }

  return (
    <AppShell staff={result.staff} sections={navSectionsForRole(result.staff.role)}>
      {children}
    </AppShell>
  );
}
