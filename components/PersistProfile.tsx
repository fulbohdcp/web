"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PENDING_KEY, buildProfileRow, buildSelfEvalRow, type PendingProfile } from "@/lib/profile";

// Runs once after the user is authenticated and still has no profile row.
// Reads the onboarding result stashed in localStorage and writes it to
// Supabase, then refreshes so the server renders the saved figurita.
export function PersistProfile() {
  const router = useRouter();
  const [status, setStatus] = useState<"saving" | "nopending" | "error">("saving");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      let pending: PendingProfile | null = null;
      try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (raw) pending = JSON.parse(raw) as PendingProfile;
      } catch {}

      if (!pending?.answers || !pending?.card) {
        setStatus("nopending");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        return;
      }

      const { error: pErr } = await supabase.from("profiles").upsert(buildProfileRow(user.id, pending));
      if (pErr) {
        console.error("profiles upsert:", pErr);
        setStatus("error");
        return;
      }
      await supabase.from("self_evaluations").insert(buildSelfEvalRow(user.id, pending));

      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      router.refresh();
    })();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60svh] max-w-[420px] flex-col items-center justify-center px-5 text-center">
      {status === "saving" && (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-green-light" />
          <p className="mt-4 font-condensed text-sm uppercase tracking-[0.18em] text-ink-muted">Guardando tu figurita…</p>
        </>
      )}
      {status === "nopending" && (
        <>
          <h1 className="font-condensed text-2xl font-extrabold uppercase text-ink">Todavía no armaste tu figurita</h1>
          <p className="mt-2 text-sm text-ink-muted">Respondé el cuestionario y guardala en tu cuenta.</p>
          <Link
            href="/onboarding"
            className="mt-6 rounded-2xl px-6 py-3.5 font-condensed text-base font-extrabold uppercase tracking-[0.12em] text-ink"
            style={{ background: "linear-gradient(135deg, oklch(0.56 0.14 152), oklch(0.38 0.10 152))" }}
          >
            Armar mi figurita
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="font-condensed text-2xl font-extrabold uppercase text-ink">Algo salió mal al guardar</h1>
          <p className="mt-2 text-sm text-ink-muted">Probá de nuevo. Si sigue, puede ser el nombre de usuario ya tomado.</p>
          <Link
            href="/onboarding"
            className="mt-6 rounded-2xl border border-line px-6 py-3.5 font-condensed text-base font-bold uppercase tracking-[0.12em] text-ink-soft"
          >
            Volver al cuestionario
          </Link>
        </>
      )}
    </div>
  );
}
