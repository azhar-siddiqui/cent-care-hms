# CentCare Pro HMS — Requirements

Internal hospital system for staff only. Patients do not log in.

The app must work on a phone, a tablet, and a desktop. Build the layout mobile-first.

## Product goal

Staff should register OPD patients, admit IPD patients onto beds, record treatment, bill simple services, track stock, and record daily expenses.

## Technical stack

| Area        | Choice                                                        |
| ----------- | ------------------------------------------------------------- |
| App         | Next.js App Router, TypeScript, React                         |
| UI          | Tailwind CSS, shadcn/ui, Tabler icons (`@tabler/icons-react`) |
| Font        | Inter only                                                    |
| Database    | Supabase PostgreSQL                                           |
| ORM         | Prisma                                                        |
| Auth        | Supabase Auth                                                 |
| Server data | Prisma Client                                                 |
| Client data | TanStack Query                                                |
| Later       | Installable PWA and offline caching                           |

Environment values live in `.env`. Do not commit that file.

| Variable                               | Use                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`                         | App queries. Supabase transaction pooler, port 6543, `?pgbouncer=true`   |
| `DIRECT_URL`                           | Prisma migrations. Direct host `db.[project-ref].supabase.co`, port 5432 |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser key                                                              |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server only. Seed and admin auth tasks. Never expose it to the browser   |
| `SEED_ADMIN_EMAIL`                     | First super admin email                                                  |
| `SEED_ADMIN_PASSWORD`                  | First super admin password                                               |

## Roles

| Role           | Access                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `SUPER_ADMIN`  | One account, created by the seed. Full access. Can invite admins                                                 |
| `ADMIN`        | Same hospital work as every other role, plus staff management. At most 3 extra admins, including pending invites |
| `RECEPTIONIST` | OPD registration, OPD fees, referring doctors, IPD check-in and check-out                                        |
| `DOCTOR`       | Treatment updates, dose logs, clinical progress notes                                                            |
| `NURSE`        | Bed status, medication logs, oxygen and vital entries                                                            |

An admin can do the receptionist, doctor, and nurse actions as well.

There is no public patient login.

## Admin invites

- The super admin invites more admins by email.
- A pending invite counts toward the limit of 3.
- Invite states: `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`.
- The database blocks a fourth admin and a second super admin.

## OPD

- Search an existing patient or register a new one.
- Patient fields: name, phone, age, gender, address.
- Each visit gets an automatic visit ID.
- Record the consultation fee.
- Payment mode: Cash, UPI, or Card.
- Payment status: Pending or Paid.
- Record the referring doctor, the referral fee, and the outside hospital when the patient was sent from another hospital.

## IPD and beds

Ward types:

- Day Care
- General
- ICU
- Semi-ICU / Deluxe

Bed status:

- Occupied
- Vacant
- Cleaning

Rules:

- An occupied bed must have a patient.
- A vacant or cleaning bed must not have a patient.
- A patient can have only one open admission.
- A bed can have only one open admission.

Admission flow:

- Check the patient in and assign a vacant bed.
- Show a bed board for each ward.
- Check the patient out with a final billing summary.

Tracking:

- Dose log: medicine name, dosage, staff id, staff name, time.
- Progress notes for treatment updates.
- Daily bed status overview.

## Service charges

- Quick billing for ECG and other procedures.
- Daily oxygen entry in cylinders or liters, linked to a patient and, when relevant, an IPD admission.

Service types: `ECG`, `PROCEDURE`, `OXYGEN`.

## Inventory

- Item name, quantity, unit, and low-stock threshold.
- Fast plus and minus adjustments.
- Show items that are at or below the reorder level.

The seed loads sample stock: gloves, syringes, paracetamol, saline, oxygen cylinders, masks, IV cannulas, and cotton rolls.

## Daily expenses

- Fields: category, amount, description, payment method, date, and the staff member who entered it.
- A view of that day's cash going out.

Payment methods match OPD: Cash, UPI, Card.

## Data already in the database

These models exist in `prisma/schema.prisma` and in the first migration:

- `User` and `AdminInvitation`
- `Patient`
- `OpdVisit`
- `Bed`
- `IpdAdmission`
- `IpdDoseLog`
- `IpdProgressNote`
- `ServiceCharge`
- `InventoryItem`
- `DailyExpense`

The seed creates:

- One super admin (`SEED_ADMIN_EMAIL`, default `admin@centcare.local`)
- 20 vacant beds: 4 Day Care, 8 General, 4 ICU, 4 Semi-ICU / Deluxe
- 8 inventory items

Screens for this data are not built yet.

## Out of scope for the first build

- Patient portal
- Pharmacy purchase orders
- Full accounting or tax invoices
- Lab machine integrations
- Appointment scheduling
