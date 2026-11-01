'use client';

import { acceptInvite } from '@/app/invite/[token]/actions';
import { acceptInviteSchema, type AcceptInviteValues } from '@/app/invite/[token]/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconAlertCircle, IconEye, IconEyeOff, IconLock, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function AcceptForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ready, setReady] = useState<'switch' | 'created' | null>(null);
  const form = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { token, fullName: '', password: '', confirmPassword: '' },
  });
  const nameError = form.formState.errors.fullName;
  const passwordError = form.formState.errors.password;
  const confirmError = form.formState.errors.confirmPassword;
  const busy = form.formState.isSubmitting;

  async function onSubmit(values: AcceptInviteValues) {
    setFormError(null);
    const result = await acceptInvite(values);

    if (!result) {
      return;
    }

    if ('error' in result) {
      setFormError(result.error);
      toast.error(result.error);
      return;
    }

    setReady(result.ready);
    toast.success('Account created.');
  }

  if (ready === 'switch') {
    return (
      <Alert>
        <AlertDescription>
          This account is ready. Sign out, then sign in with the invited email.
        </AlertDescription>
      </Alert>
    );
  }

  if (ready === 'created') {
    return (
      <div className="grid gap-4">
        <Alert>
          <AlertDescription>
            This account is ready. Sign in with the invited email and the password you just
            chose.
          </AlertDescription>
        </Alert>
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          className="h-11 w-full text-sm"
        >
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form className="mt-8" noValidate aria-busy={busy} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(nameError) || undefined}>
          <FieldLabel className="text-sm" htmlFor="full-name">
            Full name
          </FieldLabel>
          <InputGroup className="h-11" data-disabled={busy || undefined}>
            <InputGroupAddon>
              <IconUser stroke={1.75} />
            </InputGroupAddon>
            <InputGroupInput
              id="full-name"
              className="h-11 text-sm"
              autoComplete="name"
              placeholder="Dr. Meera Shah"
              disabled={busy}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'full-name-error' : undefined}
              {...form.register('fullName')}
            />
          </InputGroup>
          <FieldError id="full-name-error" errors={[nameError]} />
        </Field>

        <Field data-invalid={Boolean(passwordError) || undefined}>
          <FieldLabel className="text-sm" htmlFor="password">
            Password
          </FieldLabel>
          <InputGroup className="h-11" data-disabled={busy || undefined}>
            <InputGroupAddon>
              <IconLock stroke={1.75} />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              className="h-11 text-sm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={busy}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-error' : undefined}
              {...form.register('password')}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={busy}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <IconEyeOff stroke={1.75} /> : <IconEye stroke={1.75} />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError id="password-error" errors={[passwordError]} />
        </Field>

        <Field data-invalid={Boolean(confirmError) || undefined}>
          <FieldLabel className="text-sm" htmlFor="confirm-password">
            Repeat password
          </FieldLabel>
          <InputGroup className="h-11" data-disabled={busy || undefined}>
            <InputGroupAddon>
              <IconLock stroke={1.75} />
            </InputGroupAddon>
            <InputGroupInput
              id="confirm-password"
              className="h-11 text-sm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat the password"
              disabled={busy}
              aria-invalid={Boolean(confirmError)}
              aria-describedby={confirmError ? 'confirm-password-error' : undefined}
              {...form.register('confirmPassword')}
            />
          </InputGroup>
          <FieldError id="confirm-password-error" errors={[confirmError]} />
        </Field>

        {formError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="h-11 w-full text-sm" disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </FieldGroup>
    </form>
  );
}
