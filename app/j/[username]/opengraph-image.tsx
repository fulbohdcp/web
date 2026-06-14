import { ImageResponse } from "next/og";
import { createAnonClient } from "@/lib/supabase/anon";
import { displayName } from "@/lib/profile";

export const alt = "Figurita HDCP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SCORE_COLOR: Record<string, string> = {
  verde: "#f5c518",
  dorada: "#f7ecc8",
  azul: "#9ec9ff",
  roja: "#ffcccc",
};

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = createAnonClient();
  const profile = supabase
    ? (
        await supabase
          .from("profiles")
          .select("nombre,apellido,apodo,display_pref,titulo,posicion,auto_score,tier,stat_tecnico,stat_fisico,stat_equipo")
          .eq("username", username.toLowerCase())
          .maybeSingle()
      ).data
    : null;

  const nombre = (profile ? displayName(profile) : "Jugador").toUpperCase();
  const score = Number(profile?.auto_score ?? 0).toFixed(1);
  const titulo = profile?.titulo ?? "";
  const posicion = profile?.posicion ?? "";
  const scoreColor = SCORE_COLOR[profile?.tier ?? "verde"] ?? "#f5c518";
  const stats: [string, unknown][] = [
    ["TÉCNICO", profile?.stat_tecnico],
    ["FÍSICO", profile?.stat_fisico],
    ["EQUIPO", profile?.stat_equipo],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0e120f",
          backgroundImage: "linear-gradient(135deg, #0f1410 0%, #10301c 100%)",
          color: "#f5f0e8",
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: 10 }}>HDCP</div>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: "#9aa39b" }}>EL HANDICAP DEL FÚTBOL</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div style={{ display: "flex", fontSize: 240, fontWeight: 800, lineHeight: 1, color: scoreColor }}>{score}</div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 800, marginTop: 8 }}>{nombre}</div>
            {titulo ? (
              <div style={{ display: "flex", fontSize: 34, color: "#f5c518", letterSpacing: 3, marginTop: 10 }}>{titulo}</div>
            ) : null}
            <div style={{ display: "flex", fontSize: 26, color: "#9aa39b", marginTop: 6 }}>{posicion}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {stats.map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  border: "1px solid rgba(245,240,232,0.14)",
                  borderRadius: 18,
                  padding: "14px 26px",
                  minWidth: 168,
                }}
              >
                <div style={{ display: "flex", fontSize: 46, fontWeight: 800, color: "#f5c518" }}>
                  {val ? Number(val).toFixed(1) : "—"}
                </div>
                <div style={{ display: "flex", fontSize: 18, letterSpacing: 2, color: "#9aa39b" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#9aa39b" }}>handicap · @{username}</div>
      </div>
    ),
    { ...size },
  );
}
