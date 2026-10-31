-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "payment_mode" AS ENUM ('CASH', 'UPI', 'CARD');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "ward_type" AS ENUM ('DAY_CARE', 'GENERAL', 'ICU', 'SEMI_ICU_DELUXE');

-- CreateEnum
CREATE TYPE "bed_status" AS ENUM ('OCCUPIED', 'VACANT', 'CLEANING');

-- CreateEnum
CREATE TYPE "admission_status" AS ENUM ('ADMITTED', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "service_type" AS ENUM ('ECG', 'PROCEDURE', 'OXYGEN');

-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "supabase_user_id" UUID,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "staff_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invitations" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "invitation_status" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "patient_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "gender" NOT NULL,
    "age" INTEGER NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_visits" (
    "id" UUID NOT NULL,
    "visit_number" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "consultation_fee" DECIMAL(12,2) NOT NULL,
    "referring_doctor_name" TEXT,
    "referring_hospital" TEXT,
    "referral_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_mode" "payment_mode",
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opd_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" UUID NOT NULL,
    "bed_number" TEXT NOT NULL,
    "ward_type" "ward_type" NOT NULL,
    "status" "bed_status" NOT NULL DEFAULT 'VACANT',
    "assigned_patient_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_admissions" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "bed_id" UUID NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharge_date" TIMESTAMP(3),
    "status" "admission_status" NOT NULL DEFAULT 'ADMITTED',
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ipd_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_dose_logs" (
    "id" UUID NOT NULL,
    "ipd_admission_id" UUID NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "administered_by" UUID NOT NULL,
    "administered_by_name" TEXT NOT NULL,
    "administered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ipd_dose_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_progress_notes" (
    "id" UUID NOT NULL,
    "ipd_admission_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ipd_progress_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_charges" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "ipd_admission_id" UUID,
    "service_type" "service_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity" DECIMAL(12,3),
    "unit" TEXT,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "reorder_level" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_expenses" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "payment_method" "payment_mode" NOT NULL,
    "expense_date" DATE NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_user_id_key" ON "users"("supabase_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_token_hash_key" ON "admin_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "admin_invitations_email_status_idx" ON "admin_invitations"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_number_key" ON "patients"("patient_number");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_full_name_idx" ON "patients"("full_name");

-- CreateIndex
CREATE UNIQUE INDEX "opd_visits_visit_number_key" ON "opd_visits"("visit_number");

-- CreateIndex
CREATE INDEX "opd_visits_patient_id_idx" ON "opd_visits"("patient_id");

-- CreateIndex
CREATE INDEX "opd_visits_created_at_idx" ON "opd_visits"("created_at");

-- CreateIndex
CREATE INDEX "beds_status_idx" ON "beds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "beds_ward_type_bed_number_key" ON "beds"("ward_type", "bed_number");

-- CreateIndex
CREATE INDEX "ipd_admissions_patient_id_idx" ON "ipd_admissions"("patient_id");

-- CreateIndex
CREATE INDEX "ipd_admissions_bed_id_idx" ON "ipd_admissions"("bed_id");

-- CreateIndex
CREATE INDEX "ipd_admissions_status_idx" ON "ipd_admissions"("status");

-- CreateIndex
CREATE INDEX "ipd_dose_logs_ipd_admission_id_idx" ON "ipd_dose_logs"("ipd_admission_id");

-- CreateIndex
CREATE INDEX "ipd_progress_notes_ipd_admission_id_idx" ON "ipd_progress_notes"("ipd_admission_id");

-- CreateIndex
CREATE INDEX "service_charges_patient_id_idx" ON "service_charges"("patient_id");

-- CreateIndex
CREATE INDEX "service_charges_service_type_idx" ON "service_charges"("service_type");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_name_key" ON "inventory_items"("name");

-- CreateIndex
CREATE INDEX "daily_expenses_expense_date_idx" ON "daily_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "daily_expenses_category_idx" ON "daily_expenses"("category");

-- AddForeignKey
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_assigned_patient_id_fkey" FOREIGN KEY ("assigned_patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_dose_logs" ADD CONSTRAINT "ipd_dose_logs_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_dose_logs" ADD CONSTRAINT "ipd_dose_logs_administered_by_fkey" FOREIGN KEY ("administered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_progress_notes" ADD CONSTRAINT "ipd_progress_notes_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_progress_notes" ADD CONSTRAINT "ipd_progress_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_charges" ADD CONSTRAINT "service_charges_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_charges" ADD CONSTRAINT "service_charges_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_charges" ADD CONSTRAINT "service_charges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_expenses" ADD CONSTRAINT "daily_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Clinical guards and admin hierarchy
-- Extra rules Prisma cannot express: occupancy, money, one open admission, and the admin cap.

ALTER TABLE patients
  ADD CONSTRAINT patients_age_check CHECK (age >= 0 AND age <= 150);

ALTER TABLE opd_visits
  ADD CONSTRAINT opd_visits_fee_check CHECK (consultation_fee >= 0 AND referral_fee >= 0);

ALTER TABLE ipd_admissions
  ADD CONSTRAINT ipd_admissions_amount_check CHECK (total_amount >= 0);

ALTER TABLE service_charges
  ADD CONSTRAINT service_charges_amount_check CHECK (amount >= 0 AND (quantity IS NULL OR quantity >= 0));

ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_quantity_check CHECK (quantity >= 0 AND reorder_level >= 0);

ALTER TABLE daily_expenses
  ADD CONSTRAINT daily_expenses_amount_check CHECK (amount > 0);

ALTER TABLE beds
  ADD CONSTRAINT beds_occupancy_check CHECK (
    (status = 'OCCUPIED' AND assigned_patient_id IS NOT NULL)
    OR (status <> 'OCCUPIED' AND assigned_patient_id IS NULL)
  );

CREATE UNIQUE INDEX ipd_one_active_admission_per_patient
  ON ipd_admissions (patient_id)
  WHERE status = 'ADMITTED';

CREATE UNIQUE INDEX ipd_one_active_admission_per_bed
  ON ipd_admissions (bed_id)
  WHERE status = 'ADMITTED';

CREATE OR REPLACE FUNCTION enforce_user_role_limits()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF NEW.role = 'SUPER_ADMIN' AND EXISTS (
    SELECT 1 FROM users WHERE role = 'SUPER_ADMIN' AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Only one super admin is allowed';
  END IF;

  IF NEW.role = 'ADMIN' THEN
    SELECT COUNT(*) INTO admin_count
    FROM users
    WHERE role = 'ADMIN' AND id <> NEW.id;

    IF admin_count >= 3 THEN
      RAISE EXCEPTION 'Additional admin limit reached (maximum 3 admins besides the super admin)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_admin_invitation_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_count integer;
  pending_count integer;
BEGIN
  IF NEW.status <> 'PENDING' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'ADMIN';
  SELECT COUNT(*) INTO pending_count
  FROM admin_invitations
  WHERE status = 'PENDING' AND id <> NEW.id;

  IF admin_count + pending_count >= 3 THEN
    RAISE EXCEPTION 'Additional admin limit reached (maximum 3 admins, including pending invitations)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER users_admin_hierarchy
BEFORE INSERT OR UPDATE OF role ON users
FOR EACH ROW
EXECUTE FUNCTION enforce_user_role_limits();

CREATE TRIGGER admin_invitations_limit
BEFORE INSERT OR UPDATE OF status ON admin_invitations
FOR EACH ROW
EXECUTE FUNCTION enforce_admin_invitation_limit();
