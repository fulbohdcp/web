"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QuizEngine } from "./QuizEngine";
import { Figurita, type FiguritaProfile } from "@/components/Figurita";
import { createClient } from "@/lib/supabase/client";
import { buildProfileRow, buildSelfEvalRow } from "@/lib/profile";
import { computeCard, type Card } from "@/lib/scoring";
import type { Answers, Position } from "@/lib/questions";

// Account-first onboarding: the user is already authenticated. Every answer
// is saved to onboarding_drafts (debounced) so they can leave and resume.
// On completion we write the profile + self_evaluation and clear the draft.
export function OnboardingClient({
  initialAnswers,
  initialStep,
}: {
  initialAnswers: Answers;
  initialStep: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const userIdRef = useRef<string | null>(null);
  const [result, setResult] = useState<{ card: Card; profile: FiguritaProfile } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, [supabase]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onProgress = useCallback(
    (answers: Answers, step: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const uid = userIdRef.current;
        if (!uid) return;
        await supabase.from("onboarding_drafts").upsert({ user_id: uid, answers, step });
      }, 700);
    },
    [supabase],
  );

  const onComplete = useCallback(
    async (answers: Answers) => {
      const uid = userIdRef.current;
      const card = computeCard(answers);
      const pending = { answers, card };

      if (uid) {
        const { error: pErr } = await supabase.from("profiles").upsert(buildProfileRow(uid, pending));
        if (pErr) {
          setError(
            pErr.code === "23505" || /duplicate|unique/i.test(pErr.message)
              ? "Ese nombre de usuario ya está en uso. Volvé y elegí otro."
              : "No se pudo guardar tu figurita. Probá de nuevo.",
          );
          return;
        }
        await supabase.from("self_evaluations").insert(buildSelfEvalRow(uid, pending));
        await supabase.from("onboarding_drafts").delete().eq("user_id", uid);
      }

      const profile: FiguritaProfile = {
        nombre: (answers.nombre as string) || "Jugador",
        posicion: (answers.posicion as Position) || "Mediocampista",
        categoria: (answers.categoria as "amateur" | "pro") || "amateur",
        edad: answers.edad as string,
        ataja: answers.ataja as string,
      };
      if (typeof window !== "undefined") window.scrollTo(0, 0);
      setResult({ card, profile });
    },
    [supabase],
  );

  if (error) {
    return (
      <div className="mx-auto flex min-h-[100svh] max-w-[420px] flex-col items-center justify-center px-5 text-center">
        <h1 className="font-condensed text-2xl font-extrabold uppercase text-ink">No se pudo guardar</h1>
        <p className="mt-3 text-sm text-ink-soft">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-6 rounded-2xl border border-line px-6 py-3.5 font-condensed text-base font-bold uppercase tracking-[0.12em] text-ink-soft transition active:scale-[0.98]"
        >
          Volver
        </button>
      </div>
    );
  }

  if (result) return <Result card={result.card} profile={result.profile} />;

  return (
    <QuizEngine
      initialAnswers={initialAnswers}
      initialIndex={initialStep}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
}

function Result({ card, profile }: { card: Card; profile: FiguritaProfile }) {
  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[460px] flex-col items-center px-5 pb-12 pt-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%, oklch(0.52 0.13 152 / 0.22), transparent 70%)" }}
      />
      <p className="relative font-condensed text-xs font-bold uppercase tracking-[0.3em] text-green-light">
        Tu figurita está lista
      </p>
      <h1 className="relative mt-2 text-center font-condensed text-[34px] font-extrabold leading-none text-ink">
        ASÍ JUGÁS, {(profile.nombre.split(" ")[0] || "CRACK").toUpperCase()}
      </h1>

      <div className="reveal relative mt-8">
        <Figurita card={card} profile={profile} verified={false} />
      </div>

      <p className="relative mt-6 max-w-[40ch] text-center text-[13px] leading-relaxed text-ink-soft">
        Quedó guardada en tu perfil. Validala con 5 compañeros para verificarla y entrar a los rankings.
      </p>

      <Link
        href="/perfil"
        className="relative mt-7 w-full rounded-2xl px-5 py-4 text-center font-condensed text-lg font-extrabold uppercase tracking-[0.14em] text-ink transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, oklch(0.55 0.13 152), oklch(0.38 0.10 152))" }}
      >
        Ver mi perfil
      </Link>

      <style>{`
        @keyframes rise { from { opacity:0; transform: translateY(30px) scale(.96) } to { opacity:1; transform:none } }
        .reveal { animation: rise .6s cubic-bezier(0.16,1,0.3,1) both }
      `}</style>
    </div>
  );
}
