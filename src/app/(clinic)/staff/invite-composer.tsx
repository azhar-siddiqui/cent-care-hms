'use client';

import { sendInvite } from '@/app/(clinic)/staff/actions';
import { inviteSchema, type InviteValues } from '@/app/(clinic)/staff/invite-schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { invitableRoles, roleLabels, type InvitableRole } from '@/lib/access';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconAlertCircle, IconCopy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

const roleItems = invitableRoles.map((role) => ({
  value: role,
  label: roleLabels[role],
}));

const latestInviteKey = 'centcare.latest-invite';

type LatestInvite = {
  email: string;
  acceptUrl: string;
};

export function InviteComposer({
  adminSeatsFull,
  pendingEmails,
}: {
  adminSeatsFull: boolean;
  pendingEmails: string[];
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestInvite | null>(null);
  const pendingKey = pendingEmails.join('|');

  useEffect(() => {
    const saved = readLatestInvite();
    const pending = pendingKey.length > 0 ? pendingKey.split('|') : [];

    if (!saved || !pending.includes(saved.email)) {
      if (saved) {
        window.sessionStorage.removeItem(latestInviteKey);
      }

      setLatest(null);
      return;
    }

    setLatest(saved);
  }, [pendingKey]);
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: adminSeatsFull ? 'RECEPTIONIST' : 'ADMIN' },
  });
  const emailError = form.formState.errors.email;
  const roleError = form.formState.errors.role;
  const busy = form.formState.isSubmitting;

  useEffect(() => {
    if (adminSeatsFull && form.getValues('role') === 'ADMIN') {
      form.setValue('role', 'RECEPTIONIST');
    }
  }, [adminSeatsFull, form]);

  async function onSubmit(values: InviteValues) {
    setFormError(null);

    if (values.role === 'ADMIN' && adminSeatsFull) {
      const message = 'All 3 admin seats are taken, including pending invites.';
      setFormError(message);
      toast.error(message);
      return;
    }
    const result = await sendInvite(values);

    if ('error' in result) {
      setFormError(result.error);
      toast.error(result.error);
      return;
    }

    const acceptUrl = `${window.location.origin}${result.path}`;
    const nextLatest = { email: result.email, acceptUrl };
    writeLatestInvite(nextLatest);
    setLatest(nextLatest);
    form.reset({ email: '', role: values.role });
    toast.success('Invite ready. Copy the link.');
  }

  async function copyLink() {
    if (!latest) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latest.acceptUrl);
      toast.success('Invite link copied.');
    } catch {
      toast.error('The link could not be copied. Select it and copy it manually.');
    }
  }

  return (
    <div className="grid gap-4 px-4 py-4">
      <form noValidate aria-busy={busy} onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-invalid={Boolean(roleError) || undefined}>
            <FieldLabel className="text-sm" htmlFor="invite-role">
              Role
            </FieldLabel>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select<InvitableRole>
                  items={roleItems}
                  value={field.value}
                  onValueChange={(next) => {
                    if (next) {
                      field.onChange(next);
                    }
                  }}
                  disabled={busy}
                >
                  <SelectTrigger
                    id="invite-role"
                    className="h-9 w-full px-3 text-sm md:text-sm"
                    aria-invalid={Boolean(roleError)}
                    aria-describedby={roleError ? 'invite-role-error' : 'invite-role-hint'}
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {roleItems.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        disabled={item.value === 'ADMIN' && adminSeatsFull}
                        className="min-h-8 text-sm"
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription id="invite-role-hint">
              {adminSeatsFull
                ? 'Admin seats are full. Choose receptionist, doctor, or nurse, or revoke a pending admin invite.'
                : 'Admins are limited to 3 seats. Receptionists, doctors, and nurses are not.'}
            </FieldDescription>
            <FieldError id="invite-role-error" errors={[roleError]} />
          </Field>

          <Field data-invalid={Boolean(emailError) || undefined}>
            <FieldLabel className="text-sm" htmlFor="invite-email">
              Email
            </FieldLabel>
            <Input
              id="invite-email"
              className="text-sm md:text-sm"
              type="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@hospital.org"
              disabled={busy}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'invite-email-error' : 'invite-email-hint'}
              {...form.register('email')}
            />
            <FieldDescription id="invite-email-hint">
              Mail is not connected. Copy the link after sending and give it to this person. It
              expires in 7 days.
            </FieldDescription>
            <FieldError id="invite-email-error" errors={[emailError]} />
          </Field>

          {formError ? (
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="h-9 w-full px-4 text-sm sm:w-fit" disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? 'Sending…' : 'Send invite'}
          </Button>
        </FieldGroup>
      </form>

      {latest ? (
        <Alert>
          <AlertDescription>
            <span className="font-medium text-foreground">Link for {latest.email}</span>
            <span className="mt-1 block break-all text-foreground">{latest.acceptUrl}</span>
            <span className="mt-1 block">
              Copy it now. A new invite replaces this link in this browser.
            </span>
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-8 px-3 text-sm"
              onClick={copyLink}
            >
              <IconCopy stroke={1.75} />
              Copy link
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function readLatestInvite(): LatestInvite | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(latestInviteKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LatestInvite>;

    if (typeof parsed.email !== 'string' || typeof parsed.acceptUrl !== 'string') {
      return null;
    }

    if (!parsed.acceptUrl.startsWith(`${window.location.origin}/invite/`)) {
      return null;
    }

    return { email: parsed.email, acceptUrl: parsed.acceptUrl };
  } catch {
    return null;
  }
}

function writeLatestInvite(invite: LatestInvite) {
  window.sessionStorage.setItem(latestInviteKey, JSON.stringify(invite));
}
