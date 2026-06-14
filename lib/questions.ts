// ───────────────────────────────────────────────
// HDCP onboarding — question model & dynamic flow
// Ported from the pilot (pilot_hdcp.html), restructured
// for a one-question-per-screen (typeform-style) engine.
// The flow branches on the chosen position.
// ───────────────────────────────────────────────

export type Position = "Delantero" | "Mediocampista" | "Defensor" | "Arquero";
export type Format = "F5" | "F7" | "F8" | "F9" | "F11";

export type Section =
  | "identidad"
  | "tecnico"
  | "fisico"
  | "equipo"
  | "mental"
  | "situaciones"
  | "liderazgo";

export const SECTION_META: Record<Section, { label: string; icon: string }> = {
  identidad: { label: "Quién sos", icon: "👤" },
  tecnico: { label: "Técnico", icon: "🦶" },
  fisico: { label: "Físico", icon: "💪" },
  equipo: { label: "Equipo", icon: "🤝" },
  mental: { label: "Mental", icon: "🧠" },
  situaciones: { label: "Situaciones", icon: "⚽" },
  liderazgo: { label: "Liderazgo", icon: "🎤" },
};

type Base = { id: string; section: Section; title: string; sublabel?: string };

export type Question =
  | (Base & { kind: "text"; placeholder?: string; maxLength?: number })
  | (Base & { kind: "choice"; options: { value: string; label: string; hint?: string }[] })
  | (Base & { kind: "multi"; min?: number; options: { value: string; label: string }[] })
  | (Base & { kind: "scale" }) // 1–10 self rating
  | (Base & { kind: "rated"; options: { value: number; label: string }[] }); // scored multiple choice

export type Answers = Record<string, string | number | string[]>;

// Descriptor shown for each 1–10 self rating value
export const SCALE_DESC: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Flojo",
  4: "Por debajo",
  5: "Regular",
  6: "Bien",
  7: "Bastante bien",
  8: "Muy bien",
  9: "Excelente",
  10: "Élite 🌟",
};

const scale = (id: string, section: Section, title: string, sublabel?: string): Question => ({
  id,
  section,
  kind: "scale",
  title,
  sublabel,
});

const rated = (
  id: string,
  section: Section,
  title: string,
  options: { value: number; label: string }[],
): Question => ({ id, section, kind: "rated", title, options });

// ── IDENTIDAD (profile basics) ──
export const IDENTITY: Question[] = [
  { id: "nombre", section: "identidad", kind: "text", title: "¿Cómo te llamás?", sublabel: "Tu nombre o apodo de cancha.", placeholder: "Ej. Rodri", maxLength: 24 },
  {
    id: "usuario",
    section: "identidad",
    kind: "text",
    title: "Elegí tu nombre de usuario",
    sublabel: "Único, sin espacios. Así te encuentran tus amigos.",
    placeholder: "rodri10",
    maxLength: 20,
  },
  {
    id: "edad",
    section: "identidad",
    kind: "choice",
    title: "¿Qué edad tenés?",
    sublabel: "Te comparamos solo con tu generación.",
    options: [
      { value: "13", label: "12–15 años" },
      { value: "17", label: "16–19 años" },
      { value: "22", label: "20–25 años" },
      { value: "29", label: "26–32 años" },
      { value: "36", label: "33–40 años" },
      { value: "45", label: "41–50 años" },
      { value: "55", label: "50+ años" },
    ],
  },
  {
    id: "genero",
    section: "identidad",
    kind: "choice",
    title: "¿Con qué te identificás?",
    options: [
      { value: "M", label: "Hombre" },
      { value: "F", label: "Mujer" },
      { value: "X", label: "Prefiero no decir" },
    ],
  },
  {
    id: "categoria",
    section: "identidad",
    kind: "choice",
    title: "¿Cuál es tu nivel?",
    sublabel: "No mezclamos al del domingo con el que jugó en inferiores.",
    options: [
      { value: "amateur", label: "Amateur", hint: "Juego los fines de semana" },
      { value: "pro", label: "Pro / Inferiores", hint: "Jugué o juego competitivo" },
    ],
  },
  {
    id: "formatos",
    section: "identidad",
    kind: "multi",
    title: "¿Qué formatos jugás?",
    sublabel: "Elegí todos los que correspondan. Cada partido que cargues lleva el suyo.",
    min: 1,
    options: [
      { value: "F5", label: "Fútbol 5" },
      { value: "F7", label: "Fútbol 7" },
      { value: "F8", label: "Fútbol 8" },
      { value: "F9", label: "Fútbol 9" },
      { value: "F11", label: "Fútbol 11" },
    ],
  },
  {
    id: "posicion",
    section: "identidad",
    kind: "choice",
    title: "¿En qué posición jugás?",
    sublabel: "Define el resto del cuestionario.",
    options: [
      { value: "Delantero", label: "Delantero", hint: "⚡" },
      { value: "Mediocampista", label: "Mediocampista", hint: "🎯" },
      { value: "Defensor", label: "Defensor", hint: "🛡️" },
      { value: "Arquero", label: "Arquero", hint: "🧤" },
    ],
  },
  {
    id: "peso",
    section: "identidad",
    kind: "choice",
    title: "¿Cuánto pesás, más o menos?",
    sublabel: "Lo usamos para afinar tu físico. Queda privado.",
    options: [
      { value: "52", label: "Menos de 55 kg" },
      { value: "57", label: "55–60 kg" },
      { value: "62", label: "60–65 kg" },
      { value: "67", label: "65–70 kg" },
      { value: "72", label: "70–75 kg" },
      { value: "77", label: "75–80 kg" },
      { value: "82", label: "80–85 kg" },
      { value: "90", label: "85–95 kg" },
      { value: "98", label: "Más de 95 kg" },
    ],
  },
  {
    id: "altura",
    section: "identidad",
    kind: "choice",
    title: "¿Y cuánto medís?",
    sublabel: "Queda privado. Solo afina tu juego aéreo y velocidad.",
    options: [
      { value: "1.57", label: "Menos de 1,60 m" },
      { value: "1.62", label: "1,60–1,65 m" },
      { value: "1.67", label: "1,65–1,70 m" },
      { value: "1.72", label: "1,70–1,75 m" },
      { value: "1.77", label: "1,75–1,80 m" },
      { value: "1.82", label: "1,80–1,85 m" },
      { value: "1.87", label: "Más de 1,85 m" },
    ],
  },
];

const ATAJA: Question = {
  id: "ataja",
  section: "identidad",
  kind: "choice",
  title: "¿Atajás cuando falta arquero?",
  sublabel: "Sirve para armar equipos.",
  options: [
    { value: "no", label: "No, paso", hint: "Que ataje otro" },
    { value: "si-bien", label: "Sí, y lo hago bien", hint: "🧤 Me animo" },
    { value: "si-mal", label: "Sí, pero no me gusta" },
  ],
};

// ── SHARED: EQUIPO ──
const EQUIPO: Question[] = [
  rated("morfon", "equipo", "Tenés la pelota y hay un compañero mejor parado…", [
    { value: 10, label: "Siempre busco al mejor, no me importa quién meta el gol" },
    { value: 6, label: "Generalmente la paso, pero si la veo la voy" },
    { value: 2, label: "Si puedo definir yo, la defino yo 😈" },
  ]),
  rated("animo", "equipo", "¿Cómo sos anímicamente dentro de la cancha?", [
    { value: 10, label: "Aliento todo el partido, levanto al grupo cuando va mal" },
    { value: 6, label: "Soy tranquilo, no bajo los brazos pero tampoco grito" },
    { value: 2, label: "Si las cosas van mal me frustro y se me nota" },
  ]),
  rated("movimiento", "equipo", "¿Cómo te movés sin pelota?", [
    { value: 10, label: "Me muevo constantemente, pido y genero opciones" },
    { value: 6, label: "Juego bien cuando me la dan, pero no pido mucho" },
    { value: 2, label: "Espero que me busquen, no corro sin pelota" },
  ]),
  rated("retiene", "equipo", "¿Te quedás con la pelota cuando no debés?", [
    { value: 10, label: "Nunca: si no la puedo jugar, la toco y la paso" },
    { value: 6, label: "A veces me la quedo de más sin querer" },
    { value: 2, label: "Reconozco que me la quedo cuando no debo 😅" },
  ]),
];

const EQUIPO_ARQUERO: Question[] = [
  rated("organiza-constante", "equipo", "¿Organizás la defensa durante el partido?", [
    { value: 10, label: "Todo el tiempo: aviso posiciones, pido presión, dirijo" },
    { value: 6, label: "Hablo cuando lo veo necesario, no soy tan constante" },
    { value: 2, label: "Me concentro en atajar, no soy de hablar mucho" },
  ]),
  rated("gol-recibido", "equipo", "Cuando te hacen un gol…", [
    { value: 10, label: "Me levanto, aliento a la defensa y voy por el siguiente" },
    { value: 6, label: "Me afecta un poco pero me recompongo rápido" },
    { value: 2, label: "Me cuesta sacudírmelo, me bajan los brazos" },
  ]),
  rated("avisa-rivales", "equipo", "¿Avisás a tus defensores los rivales que vienen?", [
    { value: 10, label: "Siempre: tengo visión completa y lo comunico" },
    { value: 6, label: "A veces aviso, a veces estoy enfocado en la pelota" },
    { value: 2, label: "No, me concentro en mi posición y espero" },
  ]),
  rated("confianza-def", "equipo", "¿Tu defensa confía en vos?", [
    { value: 10, label: "Sí, saben que estoy ahí y eso les da tranquilidad" },
    { value: 6, label: "Más o menos, a veces los dejo con una salida mal calculada" },
    { value: 2, label: "Creo que prefieren resolver ellos antes que pasármela" },
  ]),
];

// ── SHARED: MENTAL ──
const MENTAL: Question[] = [
  rated("momentoclave", "mental", "¿Cómo respondés cuando el partido está en juego?", [
    { value: 10, label: "Me crece el partido, siempre aparezco cuando importa" },
    { value: 6, label: "A veces aparezco, depende del día" },
    { value: 2, label: "Me achico cuando el partido se pone tenso" },
  ]),
  rated("resiliencia", "mental", "Cuando te sale todo mal…", [
    { value: 10, label: "Me la banco, sigo intentando, no me rindo" },
    { value: 6, label: "Me frustro un poco pero me recompongo" },
    { value: 2, label: "Me desconecto del partido" },
  ]),
  rated("competitivo", "mental", "¿Qué tan competitivo sos?", [
    { value: 10, label: "Odio perder, lo doy todo hasta el final" },
    { value: 6, label: "Compito bien pero no me obsesiona ganar" },
    { value: 2, label: "Ya en el primer tiempo pienso en el asado 🥩" },
  ]),
];

// ── SHARED: LIDERAZGO ──
const LIDERAZGO: Question[] = [
  rated("liderazgo", "liderazgo", "¿Cómo sos como líder dentro de la cancha?", [
    { value: 10, label: "Organizo, hablo y llevo al grupo para adelante" },
    { value: 7, label: "Opino cuando hace falta, pero no soy el líder" },
    { value: 5, label: "Soy más de jugar que de hablar" },
    { value: 2, label: "Puteo, protesto y bajo el ambiente cuando algo sale mal 😤" },
  ]),
];

// ── POSITION-SPECIFIC blocks ──
const BY_POSITION: Record<Position, { tecnico: Question[]; fisico: Question[]; situaciones: Question[] }> = {
  Delantero: {
    tecnico: [
      scale("control", "tecnico", "Control y primer toque"),
      scale("regate", "tecnico", "Regate / gambeta / mano a mano"),
      scale("definicion", "tecnico", "Definición dentro del área"),
      scale("pivote", "tecnico", "Juego de espaldas / pivote"),
    ],
    fisico: [
      scale("velocidad", "fisico", "Velocidad / explosividad"),
      scale("fondo", "fisico", "Fondo / resistencia"),
      scale("duelos", "fisico", "Potencia en duelos físicos"),
    ],
    situaciones: [
      rated("pen-del", "situaciones", "Penales", [
        { value: 10, label: "Ni el arquero sabe para dónde va, nunca fallo" },
        { value: 7, label: "La meto casi siempre, soy del grupo de confianza" },
        { value: 4, label: "Me animo pero la mando al córner seguido" },
        { value: 1, label: "No me ofrezco, que patee otro" },
      ]),
      rated("corner-del", "situaciones", "¿Cómo aparecés en los córners ofensivos?", [
        { value: 10, label: "Siempre me desmarco bien, soy una amenaza constante" },
        { value: 6, label: "A veces llego a tiempo, a veces no" },
        { value: 2, label: "Me pierdo en los córners, no es lo mío" },
      ]),
      rated("cabeza", "situaciones", "Remate de cabeza", [
        { value: 10, label: "Es una de mis armas, gano casi todos los centros" },
        { value: 6, label: "Sumo de vez en cuando, cuando llego bien" },
        { value: 2, label: "El juego aéreo no es lo mío, prefiero ras del suelo" },
      ]),
    ],
  },
  Mediocampista: {
    tecnico: [
      scale("control", "tecnico", "Control y primer toque"),
      scale("pase", "tecnico", "Pase corto y largo"),
      scale("cambio-frente", "tecnico", "Cambio de frente / pase largo preciso"),
      scale("vision", "tecnico", "Visión de juego / lectura del partido"),
    ],
    fisico: [
      scale("fondo", "fisico", "Fondo / resistencia"),
      scale("velocidad", "fisico", "Velocidad"),
      scale("recuperacion", "fisico", "Recuperación defensiva / volvés a defender"),
    ],
    situaciones: [
      rated("tirolibre", "situaciones", "Tiro libre", [
        { value: 10, label: "La rompo: al arco o centro preciso, es un arma mía" },
        { value: 6, label: "Lo intento, a veces sale bien" },
        { value: 2, label: "La pateo y rezo" },
      ]),
      rated("asistencia", "situaciones", "Pase filtrado / asistencia de gol", [
        { value: 10, label: "La veo antes que todos, doy el pase que rompe la defensa" },
        { value: 6, label: "A veces la encuentro, a veces no" },
        { value: 2, label: "No es mi fuerte, prefiero jugar simple" },
      ]),
      rated("aparece-area", "situaciones", "¿Llegás al área y definís cuando aparecés?", [
        { value: 10, label: "Sí, llego y la meto, soy del grupo de confianza" },
        { value: 6, label: "Llego seguido pero no siempre defino bien" },
        { value: 2, label: "Me quedo en el medio, no soy de aparecer" },
      ]),
    ],
  },
  Defensor: {
    tecnico: [
      scale("anticipo", "tecnico", "Anticipo / lectura del juego ofensivo"),
      scale("marca", "tecnico", "Marca / presión al rival con balón"),
      scale("despeje", "tecnico", "Despeje / cabeza defensiva"),
      scale("posicionamiento", "tecnico", "Posicionamiento defensivo"),
    ],
    fisico: [
      scale("fondo", "fisico", "Fondo / resistencia"),
      scale("velocidad", "fisico", "Velocidad / recuperación"),
      scale("potencia", "fisico", "Potencia en duelos físicos"),
    ],
    situaciones: [
      rated("corner-def", "situaciones", "Pelota parada defensiva / córners en contra", [
        { value: 10, label: "Me ubico bien, gano casi todos los centros que entran" },
        { value: 6, label: "Me defiendo, pero a veces me ganan" },
        { value: 2, label: "Los córners en contra me complican" },
      ]),
      rated("marca-corner", "situaciones", "¿Sabés a quién marcar en una jugada preparada?", [
        { value: 10, label: "Siempre tengo claro mi marca, no dejo escapar a nadie" },
        { value: 6, label: "Generalmente sé mi marca, pero me desordeno a veces" },
        { value: 2, label: "Me confundo en las jugadas preparadas del rival" },
      ]),
      rated("anticipo-aereo", "situaciones", "Anticipo aéreo / cabeza defensiva", [
        { value: 10, label: "Gano casi todos los duelos aéreos, es mi fuerte" },
        { value: 6, label: "Me defiendo en el aire pero no domino" },
        { value: 2, label: "El juego aéreo no es lo mío" },
      ]),
    ],
  },
  Arquero: {
    tecnico: [
      scale("reflejos", "tecnico", "Reflejos / velocidad de reacción"),
      scale("salidas", "tecnico", "Salidas: ¿cuándo y cómo salís?"),
      scale("pies", "tecnico", "Juego con los pies / distribución"),
      scale("posicion-arco", "tecnico", "Posicionamiento en el arco"),
    ],
    fisico: [
      scale("elasticidad", "fisico", "Elasticidad / agilidad"),
      scale("presencia", "fisico", "Presencia física / tamaño"),
      scale("aereo-arq", "fisico", "Manejo de altura / cabeza"),
    ],
    situaciones: [
      rated("penales-arq", "situaciones", "Penales: ¿cómo te va?", [
        { value: 10, label: "Soy una pesadilla, paro la mayoría, me estudio a los pateadores" },
        { value: 7, label: "En una serie de 5 te atajo 2 seguro" },
        { value: 4, label: "Atajo de vez en cuando, suerte de mi lado" },
        { value: 1, label: "No paro casi nunca, es un festival de goles" },
      ]),
      rated("corners-arq", "situaciones", "Córners en contra: ¿salís o te quedás?", [
        { value: 10, label: "Siempre sé cuándo salir, corto casi todo lo que entra" },
        { value: 6, label: "A veces salgo, a veces me quedo, depende del centro" },
        { value: 2, label: "Me quedo pegado al palo, prefiero no arriesgar" },
      ]),
      rated("organiza-def", "situaciones", "¿Organizás la defensa en pelota parada?", [
        { value: 10, label: "Dirijo todo: la barrera, los marcajes, dónde se para cada uno" },
        { value: 6, label: "Doy algunas indicaciones cuando lo veo necesario" },
        { value: 2, label: "Soy más de atajar que de hablar" },
      ]),
      rated("posicion-pp", "situaciones", "¿Te posicionás según la jugada de pelota parada?", [
        { value: 10, label: "Sí, me muevo según el ángulo y el pateador automáticamente" },
        { value: 6, label: "Me posiciono más o menos bien, a veces me sorprenden" },
        { value: 2, label: "Me quedo en el centro del arco siempre y espero" },
      ]),
    ],
  },
};

// ───────────────────────────────────────────────
// Build the dynamic flow from current answers.
// Position drives técnico / físico / situaciones.
// Arquero gets a goalkeeper-specific equipo block, and
// skips the "¿atajás?" question.
// ───────────────────────────────────────────────
export function buildFlow(answers: Answers): Question[] {
  const pos = answers.posicion as Position | undefined;

  // Identity, injecting the "¿atajás?" question right after weight/height
  // for outfield players only (once a position is chosen).
  const identity = [...IDENTITY];
  if (pos && pos !== "Arquero") identity.push(ATAJA);

  if (!pos) return identity;

  const block = BY_POSITION[pos];
  const equipo = pos === "Arquero" ? EQUIPO_ARQUERO : EQUIPO;

  return [
    ...identity,
    ...block.tecnico,
    ...block.fisico,
    ...equipo,
    ...MENTAL,
    ...block.situaciones,
    ...LIDERAZGO,
  ];
}
