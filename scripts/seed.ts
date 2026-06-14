// Seed demo profiles. Computes each figurita with the real scoring code,
// then prints SQL (auth.users + profiles + self_evaluations + validations).
// Run:  node scripts/seed.ts | psql "$SUPABASE_DB_URL"
import { randomUUID } from "node:crypto";
import { computeCard } from "../lib/scoring.ts";

// every numeric answer key across positions
const TECH_KEYS = [
  "control","regate","definicion","pivote","pase","cambio-frente","vision","anticipo","marca",
  "despeje","posicionamiento","reflejos","salidas","pies","posicion-arco","velocidad","fondo",
  "duelos","recuperacion","potencia","elasticidad","presencia","aereo-arq","pen-del","corner-del",
  "cabeza","tirolibre","asistencia","aparece-area","corner-def","marca-corner","anticipo-aereo",
  "penales-arq","corners-arq","organiza-def","posicion-pp",
];
const EM_KEYS = [
  "morfon","animo","movimiento","retiene","organiza-constante","gol-recibido","avisa-rivales",
  "confianza-def","momentoclave","resiliencia","competitivo","liderazgo",
];

type P = {
  username: string; nombre: string; pos: string; edad: number; genero: string;
  categoria: string; peso: number; altura: number; ataja: string; formatos: string[];
  level: number; em?: number; verified?: boolean;
};

const PLAYERS: P[] = [
  { username: "valen10", nombre: "Valentina", pos: "Mediocampista", edad: 24, genero: "F", categoria: "pro", peso: 60, altura: 1.68, ataja: "no", formatos: ["F5","F11"], level: 9, verified: true },
  { username: "elpoeta", nombre: "Rodri", pos: "Delantero", edad: 29, genero: "M", categoria: "amateur", peso: 78, altura: 1.79, ataja: "si-bien", formatos: ["F5","F7","F11"], level: 9, verified: true },
  { username: "tanocorta", nombre: "Gastón", pos: "Defensor", edad: 35, genero: "M", categoria: "amateur", peso: 84, altura: 1.83, ataja: "no", formatos: ["F8","F11"], level: 7 },
  { username: "elgato1", nombre: "Lucas", pos: "Arquero", edad: 27, genero: "M", categoria: "amateur", peso: 82, altura: 1.86, ataja: "no", formatos: ["F5","F11"], level: 8 },
  { username: "totoilusion", nombre: "Toto", pos: "Delantero", edad: 31, genero: "M", categoria: "amateur", peso: 86, altura: 1.74, ataja: "si-mal", formatos: ["F5"], level: 4 },
  { username: "cocodomingo", nombre: "Coco", pos: "Mediocampista", edad: 41, genero: "M", categoria: "amateur", peso: 92, altura: 1.7, ataja: "no", formatos: ["F7"], level: 2.5 },
];

function makeAnswers(p: P): Record<string, unknown> {
  const a: Record<string, unknown> = {
    nombre: p.nombre, usuario: p.username, edad: String(p.edad), genero: p.genero,
    categoria: p.categoria, posicion: p.pos, peso: String(p.peso), altura: String(p.altura),
    ataja: p.ataja, formatos: p.formatos,
  };
  const em = p.em ?? p.level;
  for (const k of TECH_KEYS) a[k] = p.level;
  for (const k of EM_KEYS) a[k] = em;
  return a;
}

const sqlStr = (s: string) => "'" + s.replace(/'/g, "''") + "'";
const sqlArr = (arr: string[]) => "'{" + arr.join(",") + "}'";

const rows = PLAYERS.map((p) => {
  const id = randomUUID();
  const answers = makeAnswers(p);
  const card = computeCard(answers as never);
  return { p, id, answers, card };
});

const lines: string[] = [];
lines.push("begin;");

for (const { p, id, answers, card } of rows) {
  const email = `seed-${p.username}@hdcp.demo`;
  lines.push(`
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('00000000-0000-0000-0000-000000000000', ${sqlStr(id)}, 'authenticated', 'authenticated', ${sqlStr(email)},
   crypt('demo123456', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '')
on conflict (id) do nothing;`);

  lines.push(`
insert into public.profiles
  (id, username, nombre, edad, genero, categoria, posicion, formatos, peso_kg, altura_m, ataja,
   auto_score, tier, titulo, stat_tecnico, stat_fisico, stat_equipo, verified)
values
  (${sqlStr(id)}, ${sqlStr(p.username)}, ${sqlStr(p.nombre)}, ${p.edad}, ${sqlStr(p.genero)}, ${sqlStr(p.categoria)},
   ${sqlStr(p.pos)}, ${sqlArr(p.formatos)}, ${p.peso}, ${p.altura}, ${sqlStr(p.ataja)},
   ${card.score}, ${sqlStr(card.tier)}, ${sqlStr(card.titulo)}, ${card.tecnico}, ${card.fisico}, ${card.equipo}, ${!!p.verified})
on conflict (id) do update set
  username=excluded.username, nombre=excluded.nombre, auto_score=excluded.auto_score, tier=excluded.tier,
  titulo=excluded.titulo, stat_tecnico=excluded.stat_tecnico, stat_fisico=excluded.stat_fisico, stat_equipo=excluded.stat_equipo;`);

  lines.push(`
insert into public.self_evaluations
  (profile_id, posicion, answers, auto_score, tier, titulo, stat_tecnico, stat_fisico, stat_equipo)
values
  (${sqlStr(id)}, ${sqlStr(p.pos)}, $a$${JSON.stringify(answers)}$a$::jsonb,
   ${card.score}, ${sqlStr(card.tier)}, ${sqlStr(card.titulo)}, ${card.tecnico}, ${card.fisico}, ${card.equipo});`);
}

// validations: the other seed players validate the "verified" ones (≥5 → ✅)
for (const target of rows.filter((r) => r.p.verified)) {
  const evaluators = rows.filter((r) => r.id !== target.id).slice(0, 5);
  for (const e of evaluators) {
    lines.push(`
insert into public.validations (evaluator_id, subject_id, answers, score)
values (${sqlStr(e.id)}, ${sqlStr(target.id)}, '{}'::jsonb, ${Math.min(10, target.card.score)})
on conflict (evaluator_id, subject_id) do nothing;`);
  }
}

lines.push("commit;");
console.log(lines.join("\n"));
console.error("Seeded usernames: " + PLAYERS.map((p) => p.username).join(", "));
