import type { CSSProperties } from "react";
import type { Card, Tier } from "@/lib/scoring";
import { POS_ICON } from "@/lib/scoring";
import type { Position } from "@/lib/questions";

export type FiguritaProfile = {
  nombre: string;
  posicion: Position;
  categoria: "amateur" | "pro";
  edad?: string | number;
  ataja?: string;
  foto?: string;
};

type TierStyle = {
  header: string;
  footer: string;
  score: string;
  edge: string; // top border of name area
};

const TIERS: Record<Tier, TierStyle> = {
  verde: {
    header: "linear-gradient(135deg, oklch(0.52 0.13 152), oklch(0.34 0.10 152) 55%, oklch(0.45 0.12 150))",
    footer: "linear-gradient(135deg, oklch(0.34 0.10 152), oklch(0.52 0.13 152))",
    score: "oklch(0.84 0.16 92)",
    edge: "oklch(0.84 0.16 92)",
  },
  dorada: {
    header: "linear-gradient(135deg, oklch(0.80 0.13 88), oklch(0.55 0.11 70) 60%, oklch(0.72 0.13 84))",
    footer: "linear-gradient(135deg, oklch(0.55 0.11 70), oklch(0.78 0.13 86))",
    score: "oklch(0.98 0.02 95)",
    edge: "oklch(0.86 0.13 88)",
  },
  azul: {
    header: "linear-gradient(135deg, oklch(0.55 0.13 245), oklch(0.36 0.10 250) 60%, oklch(0.48 0.12 245))",
    footer: "linear-gradient(135deg, oklch(0.36 0.10 250), oklch(0.55 0.13 245))",
    score: "oklch(0.80 0.11 245)",
    edge: "oklch(0.70 0.13 245)",
  },
  roja: {
    header: "linear-gradient(135deg, oklch(0.56 0.19 25), oklch(0.38 0.14 25) 60%, oklch(0.50 0.17 25))",
    footer: "linear-gradient(135deg, oklch(0.38 0.14 25), oklch(0.56 0.19 25))",
    score: "oklch(0.88 0.07 22)",
    edge: "oklch(0.66 0.19 25)",
  },
};

export function Figurita({
  card,
  profile,
  verified = false,
  idNumber = 1,
  compact = false,
}: {
  card: Card;
  profile: FiguritaProfile;
  verified?: boolean;
  idNumber?: number;
  compact?: boolean;
}) {
  const t = TIERS[card.tier];
  const icon = POS_ICON[profile.posicion] ?? "⚽";
  const id = `#${String(idNumber).padStart(3, "0")}`;

  const scoreStyle: CSSProperties = {
    color: t.score,
    textShadow: `0 0 28px color-mix(in oklch, ${t.score} 45%, transparent)`,
  };

  return (
    <div
      className="relative w-[272px] max-w-[88vw] overflow-hidden rounded-[22px] shadow-[0_30px_80px_oklch(0.16_0.012_150_/_0.8)]"
      style={{ background: "oklch(0.18 0.013 270)" }}
    >
      {/* top-light shine */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.05), transparent 50%, oklch(1 0 0 / 0.02))" }}
      />

      {/* header */}
      <div className="relative flex items-start justify-between overflow-hidden px-4 pb-3 pt-3.5" style={{ background: t.header }}>
        <div
          className="pointer-events-none absolute -right-7 -top-7 h-28 w-28 rounded-full"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        />
        <div className="relative">
          <div className="font-display text-[13px] tracking-[0.28em] text-[oklch(1_0_0_/_0.85)]">HDCP</div>
          <div className="font-condensed text-[9px] font-semibold tracking-[0.18em] text-[oklch(1_0_0_/_0.5)]">
            2026 · 2027
          </div>
        </div>
        <div className="relative text-right">
          <div className="font-display text-[52px] leading-none" style={scoreStyle}>
            {card.score.toFixed(1)}
          </div>
          <div className="-mt-1 font-condensed text-[8px] uppercase tracking-[0.14em] text-[oklch(1_0_0_/_0.5)]">
            Puntaje
          </div>
        </div>
      </div>

      {/* photo zone */}
      <div
        className="relative flex h-[172px] items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(180deg, oklch(0.30 0.06 152), oklch(0.18 0.013 270))" }}
      >
        <div
          className="pointer-events-none absolute h-40 w-40 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.13 152 / 0.28), transparent 70%)" }}
        />
        {profile.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.foto} alt={profile.nombre} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="relative z-[1] flex h-[100px] w-[100px] items-center justify-center rounded-full text-[44px]"
            style={{ background: "linear-gradient(135deg, oklch(0.30 0.06 152), oklch(0.40 0.08 152))", border: "3px solid oklch(0.84 0.16 92 / 0.3)" }}
          >
            {icon}
          </div>
        )}
        <div
          className="absolute bottom-3 left-3.5 rounded-full px-2.5 py-[3px] font-condensed text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ background: "oklch(0.84 0.16 92 / 0.15)", border: "1px solid oklch(0.84 0.16 92 / 0.4)", color: "oklch(0.84 0.16 92)" }}
        >
          {icon} {profile.posicion}
        </div>
        <div
          className="absolute bottom-3 right-3.5 rounded-full px-2.5 py-[3px] text-[9px]"
          style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.1)", color: "oklch(1 0 0 / 0.5)" }}
        >
          {profile.edad ? `${profile.edad} años` : "—"}
        </div>
      </div>

      {/* name area */}
      <div className="relative px-4 pb-3 pt-3 text-center" style={{ background: "oklch(0.18 0.012 265)", borderTop: `2px solid ${t.edge}` }}>
        <div className="mb-1.5">
          {profile.categoria === "pro" ? (
            <span
              className="rounded-full px-2 py-0.5 font-condensed text-[9px] font-bold tracking-[0.1em]"
              style={{ color: "oklch(0.84 0.16 92)", background: "oklch(0.84 0.16 92 / 0.15)", border: "1px solid oklch(0.84 0.16 92 / 0.3)" }}
            >
              🏆 PRO / INFERIORES
            </span>
          ) : (
            <span
              className="rounded-full px-2 py-0.5 font-condensed text-[9px] font-bold tracking-[0.1em]"
              style={{ color: "oklch(0.72 0.14 152)", background: "oklch(0.52 0.13 152 / 0.2)", border: "1px solid oklch(0.64 0.15 152 / 0.3)" }}
            >
              ⚽ AMATEUR
            </span>
          )}
        </div>
        <div className="font-display text-[22px] leading-none tracking-[0.06em] text-ink">{profile.nombre.toUpperCase()}</div>
        <div className="mt-1 font-condensed text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: t.edge }}>
          {card.titulo}
        </div>
        {!compact && profile.ataja === "si-bien" && (
          <div
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-[3px] font-condensed text-[10px] font-bold tracking-[0.08em]"
            style={{ color: "oklch(0.72 0.14 152)", background: "oklch(0.52 0.13 152 / 0.25)", border: "1px solid oklch(0.64 0.15 152 / 0.4)" }}
          >
            🧤 Ataja si hace falta
          </div>
        )}
        {!compact && card.descripcion && (
          <div className="mx-auto mt-1.5 max-w-[210px] text-[10px] italic leading-tight text-ink-muted">
            “{card.descripcion}”
          </div>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-3" style={{ background: "oklch(0.15 0.012 265)", borderTop: "1px solid oklch(1 0 0 / 0.04)" }}>
        <Stat value={card.tecnico} label="Técnico" />
        <Stat value={card.fisico} label="Físico" divider />
        <Stat value={card.equipo} label="Equipo" divider />
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-3.5 py-[7px] font-display text-[9px] tracking-[0.18em]" style={{ background: t.footer, color: "oklch(1 0 0 / 0.55)" }}>
        <span>HDCP · {id}</span>
        <span className="flex items-center gap-1.5">
          {verified ? "✅ Verificado" : "Sin verificar"}
        </span>
        <span>{card.ageRange} · ARG</span>
      </div>
    </div>
  );
}

function Stat({ value, label, divider }: { value: number; label: string; divider?: boolean }) {
  return (
    <div className="px-1 py-2 text-center" style={divider ? { borderLeft: "1px solid oklch(1 0 0 / 0.05)" } : undefined}>
      <div className="font-display text-[18px] leading-none text-[oklch(0.84_0.16_92)]">
        {value > 0 ? value.toFixed(1) : "—"}
      </div>
      <div className="mt-0.5 font-condensed text-[7px] uppercase tracking-[0.12em] text-ink-muted">{label}</div>
    </div>
  );
}
