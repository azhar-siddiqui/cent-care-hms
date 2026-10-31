import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

import { PrismaClient } from '../src/generated/prisma/client';

loadEnv();
loadEnv({ path: '.env.local', override: true });

const SUPER_ADMIN_NAME = 'CentCare Super Admin';

const bedPlans = [
  { wardType: 'DAY_CARE', prefix: 'DC', count: 4 },
  { wardType: 'GENERAL', prefix: 'GW', count: 8 },
  { wardType: 'ICU', prefix: 'ICU', count: 4 },
  { wardType: 'SEMI_ICU_DELUXE', prefix: 'DLX', count: 4 },
] as const;

const inventoryItems = [
  { name: 'Examination gloves', quantity: 200, unit: 'pairs', reorderLevel: 50 },
  { name: 'Disposable syringes 5ml', quantity: 150, unit: 'pieces', reorderLevel: 40 },
  { name: 'Paracetamol 500mg', quantity: 500, unit: 'tablets', reorderLevel: 100 },
  { name: 'Normal saline 500ml', quantity: 40, unit: 'bottles', reorderLevel: 15 },
  { name: 'Oxygen cylinders', quantity: 12, unit: 'cylinders', reorderLevel: 4 },
  { name: 'Surgical masks', quantity: 300, unit: 'pieces', reorderLevel: 80 },
  { name: 'IV cannulas', quantity: 80, unit: 'pieces', reorderLevel: 20 },
  { name: 'Cotton rolls', quantity: 25, unit: 'packs', reorderLevel: 10 },
];

function requireDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL. Set it before running the seed.');
  }

  return connectionString;
}

async function findOrCreateSupabaseAdmin(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!url || !serviceKey || !password) {
    console.warn(
      'Supabase Auth user was not created. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SEED_ADMIN_PASSWORD to link the super admin.',
    );
    return null;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: SUPER_ADMIN_NAME, role: 'SUPER_ADMIN' },
  });

  if (!created.error && created.data.user) {
    return created.data.user.id;
  }

  const message = created.error?.message.toLowerCase() ?? '';
  const alreadyExists = message.includes('already') || message.includes('registered');

  if (!alreadyExists) {
    throw created.error;
  }

  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listed.error) {
    throw listed.error;
  }

  return (
    listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null
  );
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@centcare.local';
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
  });

  try {
    const supabaseUserId = await findOrCreateSupabaseAdmin(email);

    const admin = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName: SUPER_ADMIN_NAME,
        role: 'SUPER_ADMIN',
        supabaseUserId,
      },
      update: {
        fullName: SUPER_ADMIN_NAME,
        ...(supabaseUserId ? { supabaseUserId } : {}),
      },
    });

    await prisma.bed.createMany({
      data: bedPlans.flatMap((ward) =>
        Array.from({ length: ward.count }, (_, index) => ({
          wardType: ward.wardType,
          bedNumber: `${ward.prefix}-${String(index + 1).padStart(2, '0')}`,
          status: 'VACANT' as const,
        })),
      ),
      skipDuplicates: true,
    });

    for (const item of inventoryItems) {
      await prisma.inventoryItem.upsert({
        where: { name: item.name },
        create: item,
        update: {},
      });
    }

    const [bedCount, itemCount] = await Promise.all([
      prisma.bed.count(),
      prisma.inventoryItem.count(),
    ]);

    console.log(`Super admin ready: ${admin.email} (${admin.role})`);
    console.log(`Supabase Auth linked: ${admin.supabaseUserId ? 'yes' : 'no'}`);
    console.log(`Beds: ${bedCount}`);
    console.log(`Inventory items: ${itemCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
