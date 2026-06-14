"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QuizEngine } from "@/components/quiz/QuizEngine";
import { Figurita, type FiguritaProfile } from "@/components/Figurita";
import { computeCard, type Card } from "@/lib/scoring";
import { PENDING_KEY } from "@/lib/profile";
import type { Answers, Position } from "@/lib/questions";

export default function OnboardingPage() {
  const [result, setResult] = useState<{ card: Card; profile: FiguritaProfile; answers: Answers } | null>(null);

  const onComplete = useCallback((answers: Answers) => {
    const card = computeCard(answers);
    const profile: FiguritaProfile = {
      nombre: (answers.nombre as string) || "Jugador",
      posicion: (answers.posicion as Position) || "Mediocampista",
      categoria: (answers.categoria as "amateur" | "pro") || "amateur",
      edad: answers.edad as string,
      ataja: answers.ataja as string,
    };
    if (typeof window !== "undefined") window.scrollTo(0, 0);
    setResult({ card, profile, answers });
  }, []);

  if (result) return <Result card={result.card} profile={result.profile} answers={result.answers} />;
  return <QuizEngine onComplete={onComplete} />;
}

function Result({ card, profile, answers }: { card: Card; profile: FiguritaProfile; answers: Answers }) {
  // Stash the result so it gets saved to the account right after sign-up.
  useEffect(() => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ answers, card }));
    } catch {}
  }, [answers, card]);

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
        ASÍ JUGÁS, {profile.nombre.split(" ")[0].toUpperCase()}
      </h1>

      <div className="reveal relative mt-8">
        <Figurita card={card} profile={profile} verified={false} />
      </div>

      {/* validation gate */}
      <div className="relative mt-7 w-full rounded-2xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>🔒 Validá tu HDCP con 5 compañeros para publicarlo</span>
          <span className="font-display tracking-wider">0/5</span>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[oklch(1_0_0_/_0.08)]">
          <div className="h-full w-[4%] rounded-full bg-green-light" />
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          Por ahora este número es tu visión. Cuando 5 personas que te vieron jugar respondan sobre vos, tu figurita
          queda <span className="text-green-light">verificada</span> y entra a los rankings.
        </p>
      </div>

      <div className="relative mt-6 flex w-full flex-col gap-3">
        <Link
          href="/signup"
          className="w-full rounded-2xl px-5 py-4 text-center font-condensed text-lg font-extrabold uppercase tracking-[0.14em] text-ink transition-all duration-200 ease-out hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.13 152), oklch(0.38 0.10 152))" }}
        >
          Crear cuenta y guardar
        </Link>
        <Link
          href="/onboarding"
          onClick={() => {
            try {
              localStorage.removeItem("hdcp-onboarding");
            } catch {}
          }}
          className="text-center font-condensed text-sm font-bold uppercase tracking-[0.18em] text-ink-muted transition hover:text-ink"
        >
          Rehacer el cuestionario
        </Link>
      </div>

      <style>{`
        @keyframes rise { from { opacity:0; transform: translateY(30px) scale(.96) } to { opacity:1; transform:none } }
        .reveal { animation: rise .6s cubic-bezier(0.16,1,0.3,1) both }
      `}</style>
    </div>
  );
}
