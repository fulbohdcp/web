// ───────────────────────────────────────────────
// HDCP scoring — SIMULATED for now.
// Ported faithfully from the pilot so the number feels
// real, but treat the weights/IMC curve as placeholder:
// the "official" formula gets defined later. Everything
// the figurita renders comes out of computeCard().
// ───────────────────────────────────────────────

import type { Answers, Position } from "./questions";

export type Tier = "verde" | "dorada" | "azul" | "roja";

export type Card = {
  score: number; // 0–10, the headline number (auto-score until validated)
  tier: Tier;
  titulo: string; // apodo, e.g. "El Enganche"
  descripcion: string; // one-liner under the name
  tecnico: number;
  fisico: number;
  equipo: number;
  ageRange: string;
};

const num = (v: unknown, fallback = 0): number => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

// ── invisible IMC adjustment (weight/height nudge physical traits) ──
function imcAdjustment(peso: number, altura: number) {
  if (!peso || !altura) return { vel: 0, res: 0, duelos: 0, aereo: 0 };
  const imc = peso / (altura * altura);
  let vel = 0,
    res = 0,
    duelos = 0,
    aereo = 0;

  if (imc < 17) (vel = 0.1), (res = 0.1), (duelos = -0.2);
  else if (imc < 18.5) (vel = 0.1), (res = 0.1), (duelos = -0.1);
  else if (imc < 25) {
    /* normal — no change */
  } else if (imc < 27) (vel = -0.1), (res = -0.1), (duelos = 0.1);
  else if (imc < 30) (vel = -0.2), (res = -0.2), (duelos = 0.1);
  else (vel = -0.3), (res = -0.3);

  if (altura > 1.8) (aereo = 0.2), (vel = vel - 0.1);
  else if (altura < 1.65) (aereo = -0.2), (vel = vel + 0.1);

  return { vel, res, duelos, aereo };
}

const VEL_KEYS = ["velocidad"];
const RES_KEYS = ["fondo", "recuperacion"];
const DUELO_KEYS = ["duelos", "potencia", "presencia"];
const AEREO_KEYS = ["aereo-arq", "aereo", "despeje", "cabeza", "anticipo-aereo"];

function applyImc(s: Record<string, number>, peso: number, altura: number) {
  const adj = imcAdjustment(peso, altura);
  const out = { ...s };
  const bump = (keys: string[], delta: number) =>
    keys.forEach((k) => {
      if (out[k] !== undefined) out[k] = Math.min(10, Math.max(1, out[k] + delta * 10));
    });
  bump(VEL_KEYS, adj.vel);
  bump(RES_KEYS, adj.res);
  bump(DUELO_KEYS, adj.duelos);
  bump(AEREO_KEYS, adj.aereo);
  return out;
}

const avg = (s: Record<string, number>, ...keys: string[]) => {
  const vs = keys.map((k) => (s[k] !== undefined ? s[k] : 5));
  return vs.reduce((a, b) => a + b, 0) / vs.length;
};

const TEC_KEYS: Record<Position, string[]> = {
  Delantero: ["control", "regate", "definicion", "pivote"],
  Mediocampista: ["control", "pase", "cambio-frente", "vision"],
  Defensor: ["anticipo", "marca", "despeje", "posicionamiento"],
  Arquero: ["reflejos", "salidas", "pies", "posicion-arco"],
};
const FIS_KEYS: Record<Position, string[]> = {
  Delantero: ["velocidad", "fondo", "duelos"],
  Mediocampista: ["fondo", "velocidad", "recuperacion"],
  Defensor: ["fondo", "velocidad", "potencia"],
  Arquero: ["elasticidad", "presencia", "aereo-arq"],
};
const SIT_KEYS: Record<Position, string[]> = {
  Delantero: ["pen-del", "corner-del", "cabeza"],
  Mediocampista: ["tirolibre", "asistencia", "aparece-area"],
  Defensor: ["corner-def", "marca-corner", "anticipo-aereo"],
  Arquero: ["penales-arq", "corners-arq", "organiza-def", "posicion-pp"],
};
const EQUIPO_KEYS_OUT = ["morfon", "animo", "movimiento", "retiene"];
const EQUIPO_KEYS_GK = ["organiza-constante", "gol-recibido", "avisa-rivales", "confianza-def"];
const MENTAL_KEYS = ["momentoclave", "resiliencia", "competitivo"];

function toNumericScores(answers: Answers): Record<string, number> {
  const s: Record<string, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "number") s[k] = v === 0 ? 1 : v; // untouched slider → 1
  }
  return s;
}

export function computeScore(answers: Answers): number {
  const pos = (answers.posicion as Position) || "Mediocampista";
  const peso = num(answers.peso);
  const altura = num(answers.altura);
  let s = toNumericScores(answers);
  s = applyImc(s, peso, altura);

  const tec = avg(s, ...TEC_KEYS[pos]);
  const fis = avg(s, ...FIS_KEYS[pos]);
  const sit = avg(s, ...SIT_KEYS[pos]);
  const eq = avg(s, ...(pos === "Arquero" ? EQUIPO_KEYS_GK : EQUIPO_KEYS_OUT));
  const men = avg(s, ...MENTAL_KEYS);
  const lidRaw = s.liderazgo ?? 5;
  const lid = lidRaw >= 7 ? lidRaw : lidRaw <= 4 ? lidRaw / 2 : 5;
  const ataja = answers.ataja === "si-bien" ? 0.3 : 0;

  const total = tec * 0.3 + fis * 0.22 + eq * 0.2 + men * 0.15 + sit * 0.1 + lid * 0.03 + ataja;
  return Math.min(10, parseFloat(total.toFixed(1)));
}

// ── apodos / títulos (humor is part of the product) ──
type TituloEntry = { max: number; fn: (em: number) => { t: string; d: string; c: Tier } };

const TITULOS: Record<Position, TituloEntry[]> = {
  Arquero: [
    { max: 3.0, fn: (em) => (em >= 7 ? { t: "Tenemos Huevos", d: "El cuerpo no acompaña. El alma sí. Eso vale.", c: "azul" } : { t: "El Pasillero", d: "El arco es una puerta giratoria. Bienvenidos.", c: "roja" }) },
    { max: 4.5, fn: () => ({ t: "El Corajudo", d: "Se tira igual. Qué importa si no llega.", c: "azul" }) },
    { max: 5.5, fn: () => ({ t: "El Sacrificado", d: "Ataja porque nadie más quiere. Héroe anónimo.", c: "verde" }) },
    { max: 6.5, fn: () => ({ t: "El Confiable", d: "No para todo pero tampoco te hace el ridículo.", c: "verde" }) },
    { max: 7.5, fn: () => ({ t: "El Tapón", d: "Algunos días no entra ni el viento.", c: "verde" }) },
    { max: 8.5, fn: () => ({ t: "El Gato", d: "Siete vidas, siete atajadas.", c: "verde" }) },
    { max: 9.2, fn: () => ({ t: "El Pulpo", d: "Brazos en todos lados. No sabés para dónde tirarla.", c: "dorada" }) },
    { max: 10, fn: () => ({ t: "El Uno", d: "Punto.", c: "dorada" }) },
  ],
  Defensor: [
    { max: 3.0, fn: (em) => (em >= 7 ? { t: "Tenemos Huevos", d: "El cuerpo no acompaña. El alma sí. Eso vale.", c: "azul" } : { t: "El Abre Cancha", d: "Más que defender, despeja el camino al rival.", c: "roja" }) },
    { max: 4.5, fn: () => ({ t: "El Gentil", d: "No le gusta molestar al delantero. Gran persona. Mal defensor.", c: "azul" }) },
    { max: 5.5, fn: () => ({ t: "El Acompañante", d: "Corre al lado. No para nada pero es buena compañía.", c: "verde" }) },
    { max: 6.5, fn: () => ({ t: "El Ordenado", d: "Está donde tiene que estar. Nada más. Nada menos.", c: "verde" }) },
    { max: 7.5, fn: () => ({ t: "El Corta", d: "Si pasa él, ya fue. El segundo no pasa.", c: "verde" }) },
    { max: 8.5, fn: () => ({ t: "El Toro", d: "Duro, limpio y sin dramas. Como tiene que ser.", c: "verde" }) },
    { max: 9.2, fn: () => ({ t: "El Líbero", d: "Ya sabe lo que va a hacer el delantero antes que él mismo.", c: "dorada" }) },
    { max: 10, fn: () => ({ t: "El Monstruo", d: "Los 9 rivales piden jugar de mediocampista cuando lo ven.", c: "dorada" }) },
  ],
  Mediocampista: [
    { max: 3.0, fn: (em) => (em >= 7 ? { t: "Tenemos Huevos", d: "El cuerpo no acompaña. El alma sí. Eso vale.", c: "azul" } : { t: "El Fantasma", d: "Juega 40 minutos. Nadie lo vio.", c: "roja" }) },
    { max: 4.5, fn: () => ({ t: "El Kilómetros", d: "Corre más que nadie. La pelota no lo encuentra nunca.", c: "azul" }) },
    { max: 5.5, fn: () => ({ t: "El Pivote", d: "La recibe y la da. Simple. Funcional. Predecible.", c: "verde" }) },
    { max: 6.5, fn: () => ({ t: "El Motor", d: "No para. Algunas salen bien. Suficiente.", c: "verde" }) },
    { max: 7.5, fn: () => ({ t: "El Manija", d: "Cuando la tiene él, el equipo respira.", c: "verde" }) },
    { max: 8.5, fn: () => ({ t: "El Enganche", d: "Ya pensó tres jugadas antes que vos.", c: "verde" }) },
    { max: 9.2, fn: () => ({ t: "El Cerebro", d: "El partido va donde él quiere. Los demás no saben por qué.", c: "dorada" }) },
    { max: 10, fn: () => ({ t: "El Caño Fino", d: "En cualquier cancha del mundo entraría. En esta sobra.", c: "dorada" }) },
  ],
  Delantero: [
    { max: 3.0, fn: (em) => (em >= 7 ? { t: "Tenemos Huevos", d: "El cuerpo no acompaña. El alma sí. Eso vale.", c: "azul" } : { t: "El Palo", d: "Está en el área. Los goles prefieren no visitarlo.", c: "roja" }) },
    { max: 4.5, fn: () => ({ t: "El Ilusionista", d: "Cada partido parece que va a romperla. Spoiler: no.", c: "azul" }) },
    { max: 5.5, fn: () => ({ t: "El Molesto", d: "No mete goles pero incomoda. Es algo.", c: "verde" }) },
    { max: 6.5, fn: () => ({ t: "El Oportunista", d: "No crea nada. Pero si cae en sus pies, adentro.", c: "verde" }) },
    { max: 7.5, fn: () => ({ t: "El Goleador", d: "En este grupo hace diferencia. Y él lo sabe.", c: "verde" }) },
    { max: 8.5, fn: () => ({ t: "El Killer", d: "Mano a mano con el arquero. Sabemos cómo termina.", c: "verde" }) },
    { max: 9.2, fn: () => ({ t: "El Búfalo", d: "Aparece donde nadie lo espera. Siempre.", c: "dorada" }) },
    { max: 10, fn: () => ({ t: "El Máquina", d: "Los arqueros rivales ya llegaron resignados.", c: "dorada" }) },
  ],
};

const EMOCIONAL_KEYS = [
  "morfon", "animo", "movimiento", "retiene", "momentoclave", "resiliencia",
  "competitivo", "liderazgo", "organiza-constante", "gol-recibido",
  "avisa-rivales", "confianza-def",
];

function emocional(s: Record<string, number>): number {
  const vals = EMOCIONAL_KEYS.map((k) => s[k] ?? 0).filter((v) => v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
}

function getTitulo(pos: Position, score: number, em: number) {
  const lista = TITULOS[pos] || TITULOS.Mediocampista;
  for (const entry of lista) if (score <= entry.max) return entry.fn(em);
  return lista[lista.length - 1].fn(em);
}

function ageRange(edad: unknown): string {
  const a = num(edad);
  if (!a) return "—";
  if (a <= 15) return "12-15";
  if (a <= 19) return "16-19";
  if (a <= 25) return "20-25";
  if (a <= 32) return "26-32";
  if (a <= 40) return "33-40";
  if (a <= 50) return "41-50";
  return "50+";
}

const groupAvg = (s: Record<string, number>, keys: string[]) => {
  const vals = keys.map((k) => s[k] ?? 0).filter((v) => v > 0);
  return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0;
};

export function computeCard(answers: Answers): Card {
  const pos = (answers.posicion as Position) || "Mediocampista";
  const s = toNumericScores(answers);
  const score = computeScore(answers);
  const em = emocional(s);
  const { t, d, c } = getTitulo(pos, score, em);

  return {
    score,
    tier: c,
    titulo: t,
    descripcion: d,
    tecnico: groupAvg(s, TEC_KEYS[pos]),
    fisico: groupAvg(s, FIS_KEYS[pos]),
    equipo: parseFloat(em.toFixed(1)),
    ageRange: ageRange(answers.edad),
  };
}

export const POS_ICON: Record<Position, string> = {
  Delantero: "⚡",
  Mediocampista: "🎯",
  Defensor: "🛡️",
  Arquero: "🧤",
};

// ── Breakdown: every sub-answer, grouped into the 3 stages ──
export type Stage = "tecnico" | "fisico" | "actitud";
export type BreakdownGroup = { stage: Stage; label: string; items: { label: string; value: number }[] };

const SHORT_LABELS: Record<string, string> = {
  // técnico
  control: "Control", regate: "Regate", definicion: "Definición", pivote: "Pivote",
  pase: "Pase", "cambio-frente": "Cambio de frente", vision: "Visión",
  anticipo: "Anticipo", marca: "Marca", despeje: "Despeje", posicionamiento: "Posicionamiento",
  reflejos: "Reflejos", salidas: "Salidas", pies: "Juego con los pies", "posicion-arco": "Posición en el arco",
  // físico
  velocidad: "Velocidad", fondo: "Resistencia", duelos: "Duelos", recuperacion: "Recuperación",
  potencia: "Potencia", elasticidad: "Elasticidad", presencia: "Presencia", "aereo-arq": "Juego aéreo",
  // actitud — equipo
  morfon: "Generosidad", animo: "Ánimo", movimiento: "Movilidad sin pelota", retiene: "Suelta la pelota",
  "organiza-constante": "Organiza la defensa", "gol-recibido": "Reacción al gol",
  "avisa-rivales": "Comunicación", "confianza-def": "Confianza de la defensa",
  // actitud — mental
  momentoclave: "Momentos clave", resiliencia: "Resiliencia", competitivo: "Competitividad",
  // actitud — situaciones
  "pen-del": "Penales", "corner-del": "Córners ofensivos", cabeza: "Cabeza",
  tirolibre: "Tiro libre", asistencia: "Asistencias", "aparece-area": "Llegada al área",
  "corner-def": "Córners defensivos", "marca-corner": "Marca en pelota parada", "anticipo-aereo": "Anticipo aéreo",
  "penales-arq": "Penales", "corners-arq": "Córners", "organiza-def": "Organiza pelota parada",
  "posicion-pp": "Posición en pelota parada",
  // actitud — liderazgo
  liderazgo: "Liderazgo",
};

export function computeBreakdown(answers: Answers, pos: Position): BreakdownGroup[] {
  const val = (k: string) => {
    const v = answers[k];
    return typeof v === "number" && v > 0 ? v : null;
  };
  const equipoKeys = pos === "Arquero" ? EQUIPO_KEYS_GK : EQUIPO_KEYS_OUT;
  const defs: { stage: Stage; label: string; keys: string[] }[] = [
    { stage: "tecnico", label: "Técnico", keys: TEC_KEYS[pos] },
    { stage: "fisico", label: "Físico", keys: FIS_KEYS[pos] },
    { stage: "actitud", label: "Actitud", keys: [...equipoKeys, ...MENTAL_KEYS, ...SIT_KEYS[pos], "liderazgo"] },
  ];
  return defs.map((d) => ({
    stage: d.stage,
    label: d.label,
    items: d.keys
      .map((k) => ({ label: SHORT_LABELS[k] ?? k, value: val(k) }))
      .filter((it): it is { label: string; value: number } => it.value !== null),
  }));
}
