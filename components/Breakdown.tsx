import type { BreakdownGroup, Stage } from "@/lib/scoring";

const STAGE_COLOR: Record<Stage, string> = {
  tecnico: "oklch(0.64 0.15 152)", // verde
  fisico: "oklch(0.84 0.16 92)", // amarillo
  actitud: "oklch(0.70 0.13 245)", // azul
};

// Detailed bar breakdown of a player's answers, grouped by the 3 stages.
export function Breakdown({ groups }: { groups: BreakdownGroup[] }) {
  const visible = groups.filter((g) => g.items.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-6">
      {visible.map((group) => {
        const color = STAGE_COLOR[group.stage];
        return (
          <div key={group.stage}>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <h3 className="font-condensed text-sm font-bold uppercase tracking-[0.18em] text-ink">{group.label}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {group.items.map((it) => (
                <div key={it.label} className="flex items-center gap-3">
                  <span className="w-[44%] shrink-0 truncate text-[13px] text-ink-soft" title={it.label}>
                    {it.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "oklch(1 0 0 / 0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(6, it.value * 10)}%`, background: color }}
                    />
                  </div>
                  <span className="w-5 shrink-0 text-right font-display text-sm" style={{ color }}>
                    {it.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
