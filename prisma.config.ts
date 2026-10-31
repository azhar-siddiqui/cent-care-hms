import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv();
loadEnv({ path: '.env.local', override: true });

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl ?? 'postgresql://postgres:postgres@127.0.0.1:5432/centcare',
  },
});
