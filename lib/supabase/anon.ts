import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Cookie-less anonymous client for public reads (public profiles, OG images).
// Relies on RLS "select using (true)" policies. Returns null if not configured.
export function createAnonClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createSupabaseClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
