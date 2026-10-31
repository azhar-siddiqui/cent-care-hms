'use client';

import { signIn } from '@/app/login/actions';
import { loginSchema, type LoginValues } from '@/app/login/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconAlertCircle,
  IconBed,
  IconBuildingHospital,
  IconCash,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconStethoscope,
  type Icon,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const rememberedLoginKey = 'centcare.remembered-login';

type RememberedLogin = {
  email: string;
  password: string;
};

function readRememberedLogin(): RememberedLogin | null {
  try {
    const raw = localStorage.getItem(rememberedLoginKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<RememberedLogin>;
    if (typeof parsed.email !== 'string' || typeof parsed.password !== 'string') {
      return null;
    }

    if (!parsed.email && !parsed.password) {
      return null;
    }

    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

function writeRememberedLogin(value: RememberedLogin) {
  localStorage.setItem(rememberedLoginKey, JSON.stringify(value));
}

function clearRememberedLogin() {
  localStorage.removeItem(rememberedLoginKey);
}

const deskPoints: { icon: Icon; title: string; text: string }[] = [
  {
    icon: IconStethoscope,
    title: 'Registration',
    text: 'OPD visits and IPD check-in.',
  },
  {
    icon: IconBed,
    title: 'Ward care',
    text: 'Beds, medication, and notes.',
  },
  {
    icon: IconCash,
    title: 'Desk books',
    text: 'Fees, stock, and daily expenses.',
  },
];

export function LoginForm({ configured, reason }: { configured: boolean; reason?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    reason === 'unassigned' ? 'This sign-in is not an active staff account.' : null,
  );
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const busy = form.formState.isSubmitting;
  const locked = !configured || busy;
  const emailError = form.formState.errors.email;
  const passwordError = form.formState.errors.password;

  const restoredRememberedLogin = useRef(false);

  useEffect(() => {
    if (restoredRememberedLogin.current) {
      return;
    }

    restoredRememberedLogin.current = true;
    const saved = readRememberedLogin();
    if (!saved) {
      return;
    }

    form.setValue('email', saved.email);
    form.setValue('password', saved.password);
    setRemember(true);
  }, [form]);

  useEffect(() => {
    if (!remember) {
      return;
    }

    const subscription = form.watch((values) => {
      writeRememberedLogin({
        email: values.email ?? '',
        password: values.password ?? '',
      });
    });

    return () => subscription.unsubscribe();
  }, [form, remember]);

  function onRememberChange(checked: boolean) {
    setRemember(checked);

    if (!checked) {
      clearRememberedLogin();
      return;
    }

    const current = form.getValues();
    const saved = readRememberedLogin();
    const email = current.email || saved?.email || '';
    const password = current.password || saved?.password || '';

    form.setValue('email', email);
    form.setValue('password', password);

    if (email || password) {
      writeRememberedLogin({ email, password });
    }
  }

  async function onSubmit(values: LoginValues) {
    setFormError(null);

    if (remember) {
      writeRememberedLogin(values);
    } else {
      clearRememberedLogin();
    }

    const result = await signIn(values);

    if (result?.error) {
      setFormError(result.error);
      toast.error(result.error);
    }
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,oklch(0.96_0.015_166),var(--background)_18rem)] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(26rem,0.92fr)] lg:bg-background lg:bg-none">
      <aside className="relative hidden overflow-hidden bg-[oklch(0.27_0.045_166)] text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-112 rounded-full bg-[oklch(0.48_0.1_165)]/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 size-88 rounded-full bg-black/25 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
            <IconBuildingHospital className="size-5" stroke={1.75} />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">CentCare Pro</span>
            <span className="mt-0.5 block text-xs text-white/70">Hospital management</span>
          </span>
        </div>

        <div className="relative max-w-md py-12">
          <p className="text-xs font-medium tracking-[0.16em] text-white/65 uppercase">
            Staff workspace
          </p>
          <h2 className="mt-4 text-[2rem] leading-[1.15] font-semibold tracking-tight text-balance">
            The ward desk, ready for this shift.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Registration, beds, charges, stock, and expenses stay with the staff who run the
            hospital.
          </p>
          <ul className="mt-8 grid gap-4">
            {deskPoints.map((point) => {
              const PointIcon = point.icon;

              return (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <PointIcon className="size-4" stroke={1.75} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{point.title}</span>
                    <span className="mt-0.5 block text-sm text-white/70">{point.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">Internal staff only. No patient sign-in.</p>
      </aside>

      <section className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-105">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <IconBuildingHospital className="size-5" stroke={1.75} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">CentCare Pro</span>
              <span className="block text-xs text-muted-foreground">Hospital management</span>
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Use the staff account issued for this hospital.
          </p>

          <form className="mt-8" noValidate aria-busy={busy} onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              {!configured ? (
                <Alert>
                  <IconAlertCircle />
                  <AlertDescription>Sign-in is not configured on this server.</AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(emailError) || undefined}>
                <FieldLabel className="text-sm" htmlFor="email">
                  Email
                </FieldLabel>
                <InputGroup className="h-11" data-disabled={locked || undefined}>
                  <InputGroupAddon>
                    <IconMail stroke={1.75} />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    className="h-11 text-sm"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="name@hospital.org"
                    disabled={locked}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    {...form.register('email')}
                  />
                </InputGroup>
                <FieldError id="email-error" errors={[emailError]} />
              </Field>

              <Field data-invalid={Boolean(passwordError) || undefined}>
                <FieldLabel className="text-sm" htmlFor="password">
                  Password
                </FieldLabel>
                <InputGroup className="h-11" data-disabled={locked || undefined}>
                  <InputGroupAddon>
                    <IconLock stroke={1.75} />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    className="h-11 text-sm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={locked}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    {...form.register('password')}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-sm"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      disabled={locked}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <IconEyeOff stroke={1.75} /> : <IconEye stroke={1.75} />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError id="password-error" errors={[passwordError]} />
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={remember}
                  disabled={locked}
                  onCheckedChange={onRememberChange}
                />
                <FieldLabel className="text-sm font-normal" htmlFor="remember">
                  Remember me
                </FieldLabel>
              </Field>

              {formError ? (
                <Alert variant="destructive">
                  <IconAlertCircle />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" size="lg" className="h-11 w-full text-sm" disabled={locked}>
                {busy ? <Spinner /> : null}
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Staff accounts only. Ask an administrator if you need access.
          </p>
        </div>
      </section>
    </main>
  );
}
