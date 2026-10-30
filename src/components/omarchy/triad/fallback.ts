import type { Lang } from "@/i18n";
import type { Core, CoreId, TriadResponse } from "../../../../amplify/functions/triad/parse";

type Vote = Core["vote"];
type Entry = { votes: [Vote, Vote, Vote]; en: [string, string, string]; es: [string, string, string] };

const IDS: [CoreId, CoreId, CoreId] = ["ENGINEER", "COWBOY", "STUDENT"];

/** Pre-written answers used when the TRIAD backend is unreachable. Generic enough for any yes/no question. */
const POOL: Entry[] = [
  {
    votes: ["YES", "YES", "YES"],
    en: ["The numbers check out. Ship it.", "Feels right, partner. Ride on.", "Yes — and I'll learn a ton doing it."],
    es: ["Los números cuadran. Despliégalo.", "Se siente bien, compañero. Adelante.", "Sí, y aprenderé muchísimo en el camino."],
  },
  {
    votes: ["YES", "NO", "YES"],
    en: ["Low risk, high upside. Approved.", "Too much hustle for a quiet evening.", "Worth a try — mistakes are data."],
    es: ["Bajo riesgo, alto beneficio. Aprobado.", "Demasiado ajetreo para una tarde tranquila.", "Vale la pena intentarlo: los errores son datos."],
  },
  {
    votes: ["NO", "YES", "YES"],
    en: ["Insufficient data. I'd benchmark first.", "Sometimes you just gotta jump.", "I'd say yes and read the docs on the way."],
    es: ["Datos insuficientes. Primero haría un benchmark.", "A veces solo hay que saltar.", "Diría que sí y leería la documentación en el camino."],
  },
  {
    votes: ["YES", "YES", "NO"],
    en: ["Architecturally sound. Go.", "Whatever happens, happens. Sure.", "I'd want to study it a bit more first."],
    es: ["Arquitectónicamente sólido. Adelante.", "Lo que tenga que pasar, pasará. Claro.", "Primero querría estudiarlo un poco más."],
  },
  {
    votes: ["NO", "NO", "YES"],
    en: ["The failure modes outnumber the benefits.", "Bad vibes. I'll sit this one out.", "Still curious — I'd prototype it anyway."],
    es: ["Los modos de falla superan los beneficios.", "Mala espina. Paso esta vez.", "Sigo con curiosidad: igual haría un prototipo."],
  },
  {
    votes: ["NO", "YES", "NO"],
    en: ["Not until there's a test for it.", "Easy, let it roll.", "I don't understand it well enough yet."],
    es: ["No hasta que tenga una prueba.", "Tranquilo, déjalo rodar.", "Todavía no lo entiendo lo suficiente."],
  },
  {
    votes: ["YES", "NO", "NO"],
    en: ["Technically feasible within budget.", "Feels like chasing a bounty with no reward.", "I'd rather master the basics first."],
    es: ["Técnicamente viable dentro del presupuesto.", "Se siente como cazar una recompensa sin premio.", "Prefiero dominar lo básico primero."],
  },
  {
    votes: ["NO", "NO", "NO"],
    en: ["Unanimous rollback. Rethink the plan.", "Nah. Pour a coffee and wait.", "Even I'd skip this lesson."],
    es: ["Rollback unánime. Replantea el plan.", "Nah. Sírvete un café y espera.", "Hasta yo me saltaría esta lección."],
  },
  {
    votes: ["YES", "YES", "YES"],
    en: ["Serverless, cheap, observable. Yes.", "Smooth as a late-night jazz session.", "Every yes like this levels me up."],
    es: ["Serverless, barato y observable. Sí.", "Suave como una sesión de jazz nocturna.", "Cada sí como este me sube de nivel."],
  },
  {
    votes: ["YES", "NO", "YES"],
    en: ["Measurable outcome, clear owner. Approved.", "Bang. Not my kind of job.", "New stack, new notes. I'm in."],
    es: ["Resultado medible, responsable claro. Aprobado.", "Bang. No es mi tipo de trabajo.", "Nuevo stack, nuevos apuntes. Me apunto."],
  },
  {
    votes: ["NO", "YES", "YES"],
    en: ["Latency budget says no.", "Rules are more like guidelines out here.", "The best way to learn is to build it."],
    es: ["El presupuesto de latencia dice que no.", "Aquí las reglas son más bien sugerencias.", "La mejor forma de aprender es construirlo."],
  },
  {
    votes: ["YES", "YES", "NO"],
    en: ["Logs look clean. Proceed.", "See you on the other side.", "I'd ask a mentor before committing."],
    es: ["Los logs se ven limpios. Procede.", "Nos vemos del otro lado.", "Le preguntaría a un mentor antes de comprometerme."],
  },
  {
    votes: ["NO", "NO", "YES"],
    en: ["Single point of failure detected.", "The ship's low on fuel, partner.", "But think of what I'd learn!"],
    es: ["Punto único de falla detectado.", "La nave está sin combustible, compañero.", "¡Pero piensa en todo lo que aprendería!"],
  },
  {
    votes: ["YES", "NO", "NO"],
    en: ["Spec is clear enough to start.", "Some things are better left floating.", "Let me finish the tutorial first."],
    es: ["La especificación es suficiente para empezar.", "Hay cosas que es mejor dejar flotando.", "Déjame terminar el tutorial primero."],
  },
];

export const POOL_SIZE: Record<Lang, number> = { en: POOL.length, es: POOL.length };

/** FNV-1a 32-bit hash of the normalised question. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const approves = (e: Entry) => e.votes.filter((v) => v === "YES").length >= 2;
const APPROVED_POOL = POOL.filter(approves);

/** Deterministic local answer: the same question always gets the same entry; questions about Pablo approve. */
export function localAnswer(question: string, lang: Lang): TriadResponse {
  const norm = question.trim().toLowerCase();
  const pool = norm.includes("pablo") ? APPROVED_POOL : POOL;
  const e = pool[hash(norm) % pool.length];
  const lines = lang === "es" ? e.es : e.en;
  const cores = IDS.map((id, i) => ({ id, vote: e.votes[i], line: lines[i] })) as [Core, Core, Core];
  const yes = e.votes.filter((v) => v === "YES").length;
  return { cores, verdict: yes >= 2 ? "APPROVED" : "REJECTED" };
}
