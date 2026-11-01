import { AcceptForm } from '@/app/invite/[token]/accept-form';
import { Button } from '@/components/ui/button';
import { roleLabels } from '@/lib/access';
import { readAcceptInvite } from '@/lib/invites';
import { IconBuildingHospital } from '@tabler/icons-react';
import Link from 'next/link';

export const instant = false;

export const metadata = { title: 'Accept invite' };

export default async function AcceptInvitePage({ params }: PageProps<'/invite/[token]'>) {
  const { token } = await params;
  const invite = await readAcceptInvite(token);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-105">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <IconBuildingHospital className="size-5" stroke={1.75} />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">CentCare Pro</span>
            <span className="block text-xs text-muted-foreground">Hospital management</span>
          </span>
        </div>

        {invite.state === 'ready' ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Join as {roleLabels[invite.role]}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Set a name and password for <span className="text-foreground">{invite.email}</span>.
              The account is created as {roleLabels[invite.role]}.
            </p>
            <AcceptForm token={token} />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">{invite.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{invite.message}</p>
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              className="mt-8 h-11 w-full text-sm"
            >
              Go to sign in
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
