import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service role access stays in server modules. Do not import this file from a client component.

export function getServiceRoleClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    throw new Error('The service role client is server only.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
