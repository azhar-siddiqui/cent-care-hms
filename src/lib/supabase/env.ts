export type SupabasePublishableEnv = {
  url: string;
  key: string;
};

export function getSupabasePublishableEnv(): SupabasePublishableEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function requireSupabasePublishableEnv(): SupabasePublishableEnv {
  const env = getSupabasePublishableEnv();

  if (!env) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.',
    );
  }

  return env;
}
