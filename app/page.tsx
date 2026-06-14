import Link from "next/link";
import { Figurita } from "@/components/Figurita";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Card } from "@/lib/scoring";
import type { Position } from "@/lib/questions";

type RecentProfile = {
  username: string;
  nombre: string;
  posicion: Position;
  categoria: string;
  edad: number | null;
  ataja: string | null;
  foto_url: string | null;
  auto_score: number | null;
  tier: Card["tier"] | null;
  titulo: string | null;
  stat_tecnico: number | null;
  stat_fisico: number | null;
  stat_equipo: number | null;
};

async function getRecentFiguritas(): Promise<RecentProfile[]> {
  const supabase = createAnonClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select(
      "username,nombre,posicion,categoria,edad,ataja,foto_url,auto_score,tier,titulo,stat_tecnico,stat_fisico,stat_equipo",
    )
    .not("auto_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);
  return (data as RecentProfile[]) ?? [];
}

function cardFromProfile(p: RecentProfile): Card {
  return {
    score: Number(p.auto_score ?? 0),
    tier: p.tier ?? "verde",
    titulo: p.titulo ?? "",
    descripcion: "",
    tecnico: Number(p.stat_tecnico ?? 0),
    fisico: Number(p.stat_fisico ?? 0),
    equipo: Number(p.stat_equipo ?? 0),
    ageRange: "",
  };
}

const SAMPLE: Card = {
  score: 9.1,
  tier: "dorada",
  titulo: "El Cerebro",
  descripcion: "El partido va donde él quiere. Los demás no saben por qué.",
  tecnico: 9.3,
  fisico: 7.8,
  equipo: 8.6,
  ageRange: "26-32",
};

const STEPS = [
  { n: "01", h: "Te autoevaluás", p: "Una pregunta por pantalla. Técnica, físico, cabeza. Cinco minutos. Honesto o morfón, el sistema lo nota igual." },
  { n: "02", h: "Tus compañeros te validan", p: "Cinco personas que te vieron jugar responden sobre vos, a ciegas, sin ver tu autoevaluación." },
  { n: "03", h: "Sale tu HDCP", p: "Un número real, ponderado por categoría, generación y género. Sin validar, es solo tu visión." },
  { n: "04", h: "Cargás tus partidos", p: "Amistoso, torneo amateur o pro. Decís con quién jugaste y el equipo entero se califica. Tu figurita evoluciona." },
];

export default async function Landing() {
  const recent = await getRecentFiguritas();

  return (
    <main className="relative overflow-hidden">
      {/* atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 100%, oklch(0.52 0.13 152 / 0.16), transparent 65%), radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.30 0.06 152 / 0.4), transparent 60%)",
        }}
      />

      {/* top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl tracking-[0.22em] text-ink">HDCP</span>
        <Link
          href="/login"
          className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
        >
          Entrar
        </Link>
      </header>

      {/* hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-24 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.84_0.16_92_/_0.25)] bg-[oklch(0.84_0.16_92_/_0.08)] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow shadow-[0_0_8px_oklch(0.84_0.16_92)]" />
            <span className="font-condensed text-[11px] font-bold uppercase tracking-[0.24em] text-yellow">
              El handicap del fútbol
            </span>
          </div>

          <h1 className="mt-6 font-condensed text-[clamp(44px,8vw,84px)] font-black uppercase leading-[0.92] text-ink">
            Dejá de decir
            <br />
            que jugás bien.
            <br />
            <span className="text-yellow">Ahora podés saberlo.</span>
          </h1>

          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-soft">
            El golf tiene el handicap hace 150 años. El fútbol amateur, nada. Respondé el cuestionario, conseguí tu
            figurita y dejá que los que juegan con vos confirmen el número.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="rounded-2xl px-7 py-4 text-center font-condensed text-lg font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_12px_40px_oklch(0.52_0.13_152_/_0.5)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, oklch(0.56 0.14 152), oklch(0.38 0.10 152))" }}
            >
              Armar mi figurita
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-line px-7 py-4 text-center font-condensed text-lg font-extrabold uppercase tracking-[0.12em] text-ink-soft transition hover:border-ink-muted hover:text-ink"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-2 font-condensed text-xs uppercase tracking-[0.16em] text-ink-muted">
            <span>⚽ Fútbol 5 a 11</span>
            <span>✅ Validado por tus pares</span>
            <span>🏆 Rankings por generación</span>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="rotate-[3deg] transition-transform duration-500 ease-out hover:rotate-0">
            <Figurita card={SAMPLE} profile={{ nombre: "Rodrigo", posicion: "Mediocampista", categoria: "amateur", edad: "29" }} verified />
          </div>
        </div>
      </section>

      {/* recent figuritas */}
      {recent.length > 0 && (
        <section className="py-10">
          <div className="mx-auto mb-6 flex max-w-6xl items-end justify-between px-6">
            <div>
              <p className="font-condensed text-xs font-bold uppercase tracking-[0.3em] text-yellow">Últimas figuritas</p>
              <h2 className="mt-2 font-condensed text-[clamp(26px,4vw,40px)] font-black uppercase leading-none text-ink">
                Recién salidas de la cancha
              </h2>
            </div>
          </div>
          <div className="group overflow-hidden">
            <div
              className="flex w-max animate-marquee gap-4 pb-4 group-hover:[animation-play-state:paused]"
              style={{ animationDuration: `${Math.max(30, recent.length * 7)}s` }}
            >
              {[...recent, ...recent].map((p, i) => (
                <Link
                  key={`${p.username}-${i}`}
                  href={`/j/${p.username}`}
                  aria-hidden={i >= recent.length}
                  tabIndex={i >= recent.length ? -1 : undefined}
                  className="shrink-0 transition-transform duration-200 ease-out hover:-translate-y-1"
                >
                  <Figurita
                    card={cardFromProfile(p)}
                    profile={{
                      nombre: p.nombre,
                      posicion: p.posicion,
                      categoria: p.categoria === "pro" ? "pro" : "amateur",
                      edad: p.edad ?? undefined,
                      ataja: p.ataja ?? undefined,
                      foto: p.foto_url ?? undefined,
                    }}
                    compact
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* how it works */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <p className="font-condensed text-xs font-bold uppercase tracking-[0.3em] text-yellow">Cómo funciona</p>
        <h2 className="mt-3 max-w-[18ch] font-condensed text-[clamp(32px,5vw,52px)] font-black uppercase leading-[0.95] text-ink">
          Un número que <span className="text-yellow">no miente</span>
        </h2>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-5 border-t border-line pt-6">
              <span className="font-display text-5xl leading-none text-[oklch(0.84_0.16_92_/_0.55)]">{s.n}</span>
              <div>
                <h3 className="font-condensed text-xl font-bold uppercase tracking-wide text-ink">{s.h}</h3>
                <p className="mt-1.5 max-w-[42ch] text-[15px] leading-relaxed text-ink-soft">{s.p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* closing CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-28 pt-10">
        <div
          className="relative overflow-hidden rounded-[28px] border border-line px-8 py-16 text-center"
          style={{ background: "linear-gradient(135deg, oklch(0.30 0.06 152), oklch(0.18 0.013 150))" }}
        >
          <h2 className="mx-auto max-w-[20ch] font-condensed text-[clamp(28px,5vw,46px)] font-black uppercase leading-[0.95] text-ink">
            Todos creen que juegan bien.
            <br />
            <span className="text-yellow">Vos vas a tener el número.</span>
          </h2>
          <Link
            href="/onboarding"
            className="mt-8 inline-block rounded-2xl px-8 py-4 font-condensed text-lg font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_12px_40px_oklch(0.52_0.13_152_/_0.5)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, oklch(0.56 0.14 152), oklch(0.38 0.10 152))" }}
          >
            Armar mi figurita
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center">
        <div className="font-display text-3xl tracking-[0.22em] text-ink-faint">HDCP</div>
        <p className="mt-2 font-condensed text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          El handicap del fútbol
        </p>
      </footer>
    </main>
  );
}
