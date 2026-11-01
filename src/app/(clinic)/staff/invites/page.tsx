import { InviteComposer } from '@/app/(clinic)/staff/invite-composer';
import { RevokeInviteButton } from '@/app/(clinic)/staff/revoke-invite-button';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { roleLabels } from '@/lib/access';
import { loadInviteDesk, type InvitationStatusName } from '@/lib/invites';
import { requireAccess } from '@/lib/staff';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const instant = false;

export const metadata = { title: 'Staff invites' };

const statusLabels: Record<InvitationStatusName, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired',
};

const statusVariants: Record<
  InvitationStatusName,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'default',
  ACCEPTED: 'secondary',
  REVOKED: 'destructive',
  EXPIRED: 'outline',
};

export default async function StaffInvitesPage() {
  const staff = await requireAccess('/staff');

  if (staff.role !== 'SUPER_ADMIN') {
    redirect('/staff');
  }

  const desk = await loadInviteDesk();

  return (
    <>
      <PageHeader
        title="Staff invites"
        description="Choose a role, then share the invite link. Admin seats stay limited to 3."
      />
      <div className="mb-4">
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">
          Back to staff
        </Link>
      </div>

      {!desk.ok ? (
        <p className="text-sm text-muted-foreground">{desk.error}</p>
      ) : (
        <div className="grid gap-4">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Send an invite</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {desk.data.seatsUsed} of {desk.data.seatLimit} admin seats are in use.
                Receptionists, doctors, and nurses do not use an admin seat.
                {desk.data.seatsUsed >= desk.data.seatLimit
                  ? ' Admin invites are closed until a seat opens.'
                  : ''}
              </p>
            </div>
            <InviteComposer
              adminSeatsFull={desk.data.seatsUsed >= desk.data.seatLimit}
              pendingEmails={desk.data.invites
                .filter((invite) => invite.status === 'PENDING')
                .map((invite) => invite.email)}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Invite list</h2>
            </div>
            {desk.data.invites.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No invites yet.</p>
            ) : (
              <Table className="min-w-3xl text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">Email</TableHead>
                    <TableHead className="px-4">Role</TableHead>
                    <TableHead className="px-4">Status</TableHead>
                    <TableHead className="px-4">Sent</TableHead>
                    <TableHead className="px-4">Expires</TableHead>
                    <TableHead className="px-4 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {desk.data.invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="px-4 py-3 font-medium">{invite.email}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {roleLabels[invite.role]}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={statusVariants[invite.status]}>
                          {statusLabels[invite.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {invite.sentOn}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {invite.expiresOn}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {invite.status === 'PENDING' ? <RevokeInviteButton id={invite.id} /> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}
    </>
  );
}
