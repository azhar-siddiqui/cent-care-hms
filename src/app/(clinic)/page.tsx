import { PageHeader } from '@/components/shell/page-header';
import {
  bedStatusOrder,
  loadClinicSummary,
  staffRoleLabels,
  staffRoleOrder,
  wardLabels,
  wardOrder,
} from '@/lib/clinic-summary';
import { navItems } from '@/lib/navigation';
import { requireAccess } from '@/lib/staff';
import { IconBed, IconPackage, IconStethoscope, IconUsers, type Icon } from '@tabler/icons-react';
import { Suspense } from 'react';

export const instant = false;

export const metadata = {
  title: 'Overview',
};

export default async function OverviewPage() {
  await requireAccess('/');
  const page = navItems[0];

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <Suspense fallback={<OverviewFallback />}>
        <OverviewBody />
      </Suspense>
    </>
  );
}

function OverviewFallback() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

async function OverviewBody() {
  const summary = await loadClinicSummary();

  if (!summary.ok) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-card px-5 py-8 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Database unavailable</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The desk could not read the hospital database. Check the connection, then refresh this
          page.
        </p>
      </section>
    );
  }

  const { data } = summary;
  const bedTotal = wardOrder.reduce((total, ward) => total + data.wards[ward].total, 0);

  return (
    <div className="grid gap-6">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Metric icon={IconUsers} label="Patients" value={data.patients} note="Registered records" />
        <Metric
          icon={IconStethoscope}
          label="OPD visits"
          value={data.visits}
          note="All visit logs"
        />
        <Metric icon={IconBed} label="Inpatients" value={data.admitted} note="Open admissions" />
        <Metric
          icon={IconPackage}
          label="Low stock"
          value={data.lowStock}
          note={`${data.inventory} items on the list`}
          attention={data.lowStock > 0}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Beds by ward</h2>
            <p className="text-xs text-muted-foreground tabular-nums">{bedTotal} beds</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-lg text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">Ward</th>
                  {bedStatusOrder.map((status) => (
                    <th key={status} className="px-4 py-2 text-right font-medium">
                      {status === 'VACANT'
                        ? 'Vacant'
                        : status === 'OCCUPIED'
                          ? 'Occupied'
                          : 'Cleaning'}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {wardOrder.map((ward) => (
                  <tr key={ward} className="border-b border-border last:border-0">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      {wardLabels[ward]}
                    </th>
                    {bedStatusOrder.map((status) => (
                      <td
                        key={status}
                        className="px-4 py-3 text-right tabular-nums text-muted-foreground"
                      >
                        {data.wards[ward][status]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {data.wards[ward].total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Staff on record</h2>
          </div>
          <ul className="divide-y divide-border">
            {staffRoleOrder.map((role) => (
              <li key={role} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{staffRoleLabels[role]}</span>
                <span className="font-medium tabular-nums">{data.staff[role]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: IconComponent,
  label,
  value,
  note,
  attention = false,
}: {
  icon: Icon;
  label: string;
  value: number;
  note: string;
  attention?: boolean;
}) {
  return (
    <article className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <IconComponent className="size-4" stroke={1.75} />
        </span>
      </div>
      <p
        className={`mt-3 text-2xl font-semibold tabular-nums ${attention ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </article>
  );
}
