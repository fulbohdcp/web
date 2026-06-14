import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Browser-side Supabase client. Uses the public URL + anon key
// (safe to expose; protected by Row Level Security).
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY válidos en .env.local");
  return createBrowserClient(env.url, env.key);
}

// True once .env.local has both public vars filled in with a valid URL.
export const isSupabaseConfigured = getSupabaseEnv() !== null;
