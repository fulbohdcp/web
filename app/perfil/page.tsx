import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Figurita, type FiguritaProfile } from "@/components/Figurita";
import { PersistProfile } from "@/components/PersistProfile";
import { LogoutButton } from "@/components/LogoutButton";
import { ShareButton } from "@/components/ShareButton";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Breakdown } from "@/components/Breakdown";
import { computeCard, computeBreakdown, type Card, type BreakdownGroup } from "@/lib/scoring";
import type { Answers, Position } from "@/lib/questions";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Just signed up: no profile row yet → persist the onboarding result.
  if (!profile) return <PersistProfile />;

  const { data: latestEval } = await supabase
    .from("self_evaluations")
    .select("answers")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: valCount } = await supabase
    .from("validations")
    .select("*", { count: "exact", head: true })
    .eq("subject_id", user.id);

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

  const breakdownGroups: BreakdownGroup[] = latestEval?.answers
    ? computeBreakdown(latestEval.answers as Answers, figProfile.posicion)
    : [];

  const validations = valCount ?? 0;
  const verified = validations >= 5;
  const pct = Math.min(100, (validations / 5) * 100);

  return (
    <main className="relative mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col px-5 pb-12">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px]"
        style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%, oklch(0.52 0.13 152 / 0.18), transparent 70%)" }}
      />

      <header className="flex items-center justify-between py-6">
        <Link href="/" className="font-display text-2xl tracking-[0.2em] text-ink">
          HDCP
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-condensed text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">@{profile.username}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
          <Figurita card={card} profile={figProfile} verified={verified} />
          {breakdownGroups.some((g) => g.items.length > 0) && (
            <div className="w-full max-w-[360px] lg:pt-2">
              <p className="mb-4 font-condensed text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">
                Tus respuestas
              </p>
              <Breakdown groups={breakdownGroups} />
            </div>
          )}
        </div>

        <div className="mt-9 w-full max-w-[460px] rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
            <span>{verified ? "✅ HDCP verificado" : "🔒 Validá tu HDCP con 5 compañeros para publicarlo"}</span>
            <span className="font-display tracking-wider">{validations}/5</span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-[oklch(1_0_0_/_0.08)]">
            <div className="h-full rounded-full bg-green-light" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
          {!verified && (
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              Tu número todavía es tu visión. Cuando 5 personas que te vieron jugar te validen, tu figurita queda
              verificada y entra a los rankings.
            </p>
          )}
        </div>

        <div className="mt-6 flex w-full max-w-[460px] flex-col gap-3">
          <ShareButton username={profile.username} nombre={profile.nombre} />
          <AvatarUpload hasPhoto={!!profile.foto_url} />
          <button
            disabled
            className="w-full cursor-not-allowed rounded-2xl border border-line px-5 py-4 text-center font-condensed text-base font-bold uppercase tracking-[0.12em] text-ink-faint"
          >
            Cargar un partido · próximamente
          </button>
          <Link
            href="/onboarding"
            className="text-center font-condensed text-sm font-bold uppercase tracking-[0.18em] text-ink-muted transition hover:text-ink"
          >
            Rehacer el cuestionario
          </Link>
        </div>
      </div>
    </main>
  );
}
