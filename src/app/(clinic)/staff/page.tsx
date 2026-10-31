import { PageHeader } from '@/components/shell/page-header';
import { loadClinicSummary, staffRoleLabels, staffRoleOrder } from '@/lib/clinic-summary';
import { findNavItem } from '@/lib/navigation';
import { roleAccess } from '@/lib/roles';
import { requireAccess } from '@/lib/staff';
import { Suspense } from 'react';

export const instant = false;

export const metadata = { title: 'Staff' };

export default async function StaffPage() {
  await requireAccess('/staff');
  const page = findNavItem('/staff');

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <div className="grid gap-4">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Accounts in the database</h2>
          </div>
          <Suspense fallback={<div className="h-40 animate-pulse bg-muted" />}>
            <StaffCounts />
          </Suspense>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">What each role can do</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                {roleAccess.map((row) => (
                  <tr key={row.role} className="border-b border-border last:border-0">
                    <th className="px-4 py-3 text-left align-top font-medium whitespace-nowrap">
                      {row.role}
                    </th>
                    <td className="px-4 py-3 leading-relaxed text-muted-foreground">
                      {row.access}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-sm text-muted-foreground">
          Admin invites are not open yet. The database already blocks a second super admin and a
          fourth admin.
        </p>
      </div>
    </>
  );
}

async function StaffCounts() {
  const summary = await loadClinicSummary();

  if (!summary.ok) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Staff counts could not be loaded from the database.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {staffRoleOrder.map((role) => (
        <li key={role} className="border-b border-border px-4 py-4 sm:border-r lg:last:border-r-0">
          <p className="text-xs text-muted-foreground">{staffRoleLabels[role]}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{summary.data.staff[role]}</p>
        </li>
      ))}
    </ul>
  );
}
