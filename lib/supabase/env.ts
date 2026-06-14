// Single source of truth for whether Supabase is usable.
// Returns null (→ callers no-op) unless BOTH public vars are present
// AND the URL is a real http(s) URL. Trims whitespace so a stray space
// or newline in .env.local doesn't crash the app.
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { url, key };
}
