'use client';

import { revokeInvite } from '@/app/(clinic)/staff/actions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { toast } from 'sonner';

export function RevokeInviteButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function onRevoke() {
    setPending(true);
    const result = await revokeInvite(id);
    setPending(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Invite revoked.');
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-7 px-2 text-xs"
      disabled={pending}
      onClick={onRevoke}
    >
      {pending ? <Spinner /> : null}
      Revoke
    </Button>
  );
}
