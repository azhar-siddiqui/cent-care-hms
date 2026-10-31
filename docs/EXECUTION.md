# CentCare Pro HMS — Execution plan

Do these steps in order. Each step should work on a phone and a desktop before the next one starts.

## Done

### Step 1. Project setup

- Next.js, Tailwind, shadcn/ui, and the Inter font are in place.
- Tabler icons are installed. shadcn is set to the Tabler icon library.
- Prisma 7 is connected with the Postgres driver adapter.
- Supabase browser client, server client, and session proxy exist.
- The proxy only refreshes the auth cookie. It does not send people to a login page yet.
- Env template: `.env.example`.
- Local secrets: `.env`.

### Step 2. Database and seed

- Schema: `prisma/schema.prisma`.
- Migration: `prisma/migrations/20261031120000_init`.
- Seed: `prisma/seed.ts`.
- Apply command already used: `pnpm exec prisma migrate deploy`.
- Seed command already used: `pnpm db:seed`.

Useful commands later:

```bash
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm dev
```

Use `prisma migrate deploy` on Supabase. `pnpm db:migrate` runs `migrate dev`, which needs a shadow database and is a poor fit for Supabase.

## Next

### Step 3. Login, session, and admin invites

Build this before any hospital screen.

1. Login page with email and password (Supabase Auth).
2. After login, load the matching `User` row from Prisma and keep the role on the session.
3. Block every app route except login when there is no staff session.
4. Shell layout: mobile navigation plus a sidebar on tablet and desktop.
5. Show only the links that role is allowed to open.
6. Admin invite screen for `SUPER_ADMIN`:
   - Send an invite to an email.
   - List pending, accepted, revoked, and expired invites.
   - Stop at 3 additional admins, including pending invites.
7. Accept-invite flow that creates an `ADMIN` user and links the Supabase auth id.

Check: sign in as the seeded super admin, sign out, and confirm a receptionist cannot open the invite screen.

### Step 4. OPD

1. Patient search by name or phone.
2. Registration form: name, phone, age, gender, address. Generate `patientNumber`.
3. New OPD visit with an automatic `visitNumber`.
4. Fee form: consultation fee, payment mode, payment status.
5. Referring doctor, referral fee, and outside hospital name.
6. Visit list for the day.

Reception and admin can create these records. Doctor and nurse can read them.

### Step 5. IPD and beds

1. Bed board grouped by ward. Colors or labels for Occupied, Vacant, and Cleaning.
2. Admit a patient onto a vacant bed. Create `IpdAdmission` and mark the bed occupied.
3. Nurse can change a bed to Cleaning or Vacant when the rules allow it.
4. Dose log form: medicine, dosage, staff id, staff name, time.
5. Progress note form for doctors.
6. Discharge screen with the admission total and a short bill summary. Free the bed.

Check: one patient cannot occupy two beds at once. An occupied bed cannot be saved without a patient.

### Step 6. Billing and inventory

1. Charge form for ECG, procedure, and oxygen.
2. Oxygen needs quantity and unit (cylinders or liters) and a patient. Link an open admission when one exists.
3. Inventory table with plus and minus actions.
4. Highlight rows at or below `reorderLevel`.

Admin manages stock. Reception can enter ECG and procedure fees. Nurse can enter oxygen.

### Step 7. Daily expenses

1. Expense form: category, amount, description, payment method, date.
2. Save `createdBy` as the logged-in staff member.
3. Summary of the selected day's total outflow, grouped by category and payment method.

Only admin and super admin can open this screen.

### Step 8. PWA

Do this after the staff flows work.

1. Web app manifest and icons.
2. Service worker for the app shell.
3. Install prompt on phone and tablet.
4. Clear offline state when the network is down. Do not silently save clinical writes offline unless that flow is designed on purpose.

## Suggested build order inside each step

1. Server action or route that reads and writes Prisma.
2. Role check on the server, not only in the sidebar.
3. shadcn form and list on mobile first.
4. Empty, error, and success states.
5. Click through the flow in the browser.

## What not to rebuild

- Do not add a second font. Inter is the only UI font.
- Do not add a second user table. `User` is the staff profile, linked by `supabaseUserId`.
- Do not put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable or in client components.
- Do not bypass the admin limit in the UI. The database trigger is the real guard.
