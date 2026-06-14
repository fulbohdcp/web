"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
    >
      Salir
    </button>
  );
}
