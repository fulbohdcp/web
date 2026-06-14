import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon";
import { Figurita, type FiguritaProfile } from "@/components/Figurita";
import { Breakdown } from "@/components/Breakdown";
import { computeCard, computeBreakdown, type Card, type BreakdownGroup } from "@/lib/scoring";
import type { Answers, Position } from "@/lib/questions";

type Params = { params: Promise<{ username: string }> };

async function getProfile(username: string) {
  const supabase = createAnonClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "HDCP" };
  return {
    title: `${profile.nombre} · HDCP ${Number(profile.auto_score ?? 0).toFixed(1)}`,
    description: profile.titulo
      ? `${profile.titulo}. Mirá la figurita de ${profile.nombre} en HDCP, el handicap del fútbol.`
      : `Mirá la figurita de ${profile.nombre} en HDCP, el handicap del fútbol.`,
  };
}

export default async function PublicProfile({ params }: Params) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const supabase = createAnonClient();
  const { data: latestEval } = supabase
    ? await supabase
        .from("self_evaluations")
        .select("answers")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const { count: valCount } = supabase
    ? await supabase.from("validations").select("*", { count: "exact", head: true }).eq("subject_id", profile.id)
    : { count: 0 };

  const card: Card = latestEval?.answers
    ? computeCard(latestEval.answers as Answers)
    : {
        score: Number(profile.auto_score ?? 0),
        tier: profile.tier ?? "verde",
        titulo: profile.titulo ?? "",
        descripcion: "",
        tecnico: Number(profile.stat_tecnico ?? 0),
        fisico: Number(profile.stat_fisico ?? 0),
        equipo: Number(profile.stat_equipo ?? 0),
        ageRange: "—",
      };

  const figProfile: FiguritaProfile = {
    nombre: profile.nombre,
    posicion: (profile.posicion as Position) ?? "Mediocampista",
    categoria: profile.categoria === "pro" ? "pro" : "amateur",
    edad: profile.edad ?? undefined,
    ataja: profile.ataja ?? undefined,
    foto: profile.foto_url ?? undefined,
  };

  const verified = (valCount ?? 0) >= 5;
  const breakdownGroups: BreakdownGroup[] = latestEval?.answers
    ? computeBreakdown(latestEval.answers as Answers, figProfile.posicion)
    : [];
  const hasBreakdown = breakdownGroups.some((g) => g.items.length > 0);

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center px-5 pb-12 pt-10">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 90% 55% at 50% 0%, oklch(0.52 0.13 152 / 0.18), transparent 70%)" }}
      />

      <Link href="/" className="font-display text-2xl tracking-[0.2em] text-ink">
        HDCP
      </Link>

      <div className="reveal mt-8 flex w-full max-w-3xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
        <Figurita card={card} profile={figProfile} verified={verified} />
        {hasBreakdown && (
          <div className="w-full max-w-[360px] lg:pt-2">
            <p className="mb-4 font-condensed text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">
              Sus respuestas
            </p>
            <Breakdown groups={breakdownGroups} />
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-ink-muted">
        {verified ? "Figurita verificada por sus compañeros." : "Figurita sin verificar todavía."}
      </p>

      <Link
        href="/onboarding"
        className="mt-7 rounded-2xl px-7 py-4 text-center font-condensed text-lg font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_12px_40px_oklch(0.52_0.13_152_/_0.5)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, oklch(0.56 0.14 152), oklch(0.38 0.10 152))" }}
      >
        Armá la tuya
      </Link>

      <style>{`
        @keyframes rise { from { opacity:0; transform: translateY(28px) scale(.96) } to { opacity:1; transform:none } }
        .reveal { animation: rise .6s cubic-bezier(0.16,1,0.3,1) both }
      `}</style>
    </main>
  );
}
