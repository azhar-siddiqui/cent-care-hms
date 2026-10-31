import { requireSupabasePublishableEnv } from '@/lib/supabase/env';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const { url, key } = requireSupabasePublishableEnv();

  return createBrowserClient(url, key);
}
