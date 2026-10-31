import type { BedStatus, StaffRole, WardType } from '@/generated/prisma/client';

import { getPrisma } from '@/lib/prisma';
import { connection } from 'next/server';

export const wardOrder = [
  'DAY_CARE',
  'GENERAL',
  'ICU',
  'SEMI_ICU_DELUXE',
] as const satisfies readonly WardType[];

export const bedStatusOrder = [
  'VACANT',
  'OCCUPIED',
  'CLEANING',
] as const satisfies readonly BedStatus[];

export const staffRoleOrder = [
  'SUPER_ADMIN',
  'ADMIN',
  'RECEPTIONIST',
  'DOCTOR',
  'NURSE',
] as const satisfies readonly StaffRole[];

export const wardLabels: Record<WardType, string> = {
  DAY_CARE: 'Day Care',
  GENERAL: 'General',
  ICU: 'ICU',
  SEMI_ICU_DELUXE: 'Semi-ICU / Deluxe',
};

export const staffRoleLabels: Record<StaffRole, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  RECEPTIONIST: 'Receptionist',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
};

export type WardCounts = Record<BedStatus, number> & { total: number };

export type ClinicSummary = {
  patients: number;
  visits: number;
  admitted: number;
  inventory: number;
  lowStock: number;
  wards: Record<WardType, WardCounts>;
  staff: Record<StaffRole, number>;
};

function emptyWards(): Record<WardType, WardCounts> {
  return {
    DAY_CARE: { VACANT: 0, OCCUPIED: 0, CLEANING: 0, total: 0 },
    GENERAL: { VACANT: 0, OCCUPIED: 0, CLEANING: 0, total: 0 },
    ICU: { VACANT: 0, OCCUPIED: 0, CLEANING: 0, total: 0 },
    SEMI_ICU_DELUXE: { VACANT: 0, OCCUPIED: 0, CLEANING: 0, total: 0 },
  };
}

export async function loadClinicSummary(): Promise<
  { ok: true; data: ClinicSummary } | { ok: false }
> {
  try {
    await connection();
    const prisma = getPrisma();
    const [patients, visits, admitted, items, beds, users] = await Promise.all([
      prisma.patient.count(),
      prisma.opdVisit.count(),
      prisma.ipdAdmission.count({ where: { status: 'ADMITTED' } }),
      prisma.inventoryItem.findMany({ select: { quantity: true, reorderLevel: true } }),
      prisma.bed.findMany({ select: { wardType: true, status: true } }),
      prisma.user.findMany({ select: { role: true } }),
    ]);

    const wards = emptyWards();

    for (const bed of beds) {
      const ward = wards[bed.wardType];
      ward[bed.status] += 1;
      ward.total += 1;
    }

    const staff: Record<StaffRole, number> = {
      SUPER_ADMIN: 0,
      ADMIN: 0,
      RECEPTIONIST: 0,
      DOCTOR: 0,
      NURSE: 0,
    };

    for (const user of users) {
      staff[user.role] += 1;
    }

    return {
      ok: true,
      data: {
        patients,
        visits,
        admitted,
        inventory: items.length,
        lowStock: items.filter((item) => item.quantity <= item.reorderLevel).length,
        wards,
        staff,
      },
    };
  } catch (error) {
    console.error('Clinic summary failed', error instanceof Error ? error.name : 'unknown');
    return { ok: false };
  }
}
