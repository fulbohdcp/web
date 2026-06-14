import type { Answers, Position, Format } from "./questions";
import type { Card } from "./scoring";

// Shape stashed in localStorage between onboarding and account creation,
// then written to Supabase once the user is authenticated.
export type PendingProfile = {
  answers: Answers;
  card: Card;
};

const num = (v: unknown): number | null => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

// Row for public.profiles
export function buildProfileRow(userId: string, p: PendingProfile) {
  const a = p.answers;
  return {
    id: userId,
    username: String(a.usuario ?? "").toLowerCase(),
    nombre: String(a.nombre ?? "Jugador"),
    apellido: (a.apellido as string) || null,
    apodo: (a.apodo as string) || null,
    display_pref: (a.display_pref as string) || "nombre",
    edad: num(a.edad),
    genero: (a.genero as string) ?? null,
    categoria: (a.categoria as string) ?? "amateur",
    posicion: (a.posicion as Position) ?? null,
    formatos: (a.formatos as Format[]) ?? [],
    peso_kg: num(a.peso),
    altura_m: num(a.altura),
    ataja: (a.ataja as string) ?? "no",
    auto_score: p.card.score,
    tier: p.card.tier,
    titulo: p.card.titulo,
    stat_tecnico: p.card.tecnico,
    stat_fisico: p.card.fisico,
    stat_equipo: p.card.equipo,
    verified: false,
  };
}

// Row for public.self_evaluations
export function buildSelfEvalRow(userId: string, p: PendingProfile) {
  return {
    profile_id: userId,
    posicion: (p.answers.posicion as Position) ?? "Mediocampista",
    answers: p.answers,
    auto_score: p.card.score,
    tier: p.card.tier,
    titulo: p.card.titulo,
    stat_tecnico: p.card.tecnico,
    stat_fisico: p.card.fisico,
    stat_equipo: p.card.equipo,
  };
}

export const PENDING_KEY = "hdcp-pending";

// Resolve the name to show, honoring the user's display preference.
export function displayName(p: {
  nombre?: string | null;
  apellido?: string | null;
  apodo?: string | null;
  display_pref?: string | null;
}): string {
  const nombre = (p.nombre || "Jugador").trim();
  if (p.display_pref === "apodo" && p.apodo?.trim()) return p.apodo.trim();
  if (p.display_pref === "nombre_apellido" && p.apellido?.trim()) return `${nombre} ${p.apellido.trim()}`;
  return nombre;
}
