import type { Lang } from "@/i18n";

export type LogEntry = {
  date: string;
  title: Record<Lang, string>;
  detail: Record<Lang, string>;
};

export const log: LogEntry[] = [
  {
    date: "2026-10",
    title: { en: "Omarchy open-source plugins", es: "Plugins open source para Omarchy" },
    detail: {
      en: "Published Omarchy Display Switch, a Win+P-style display mode switcher. ⭐ 11 on GitHub.",
      es: "Publiqué Omarchy Display Switch, un selector de modos de pantalla estilo Win+P. ⭐ 11 en GitHub.",
    },
  },
  {
    date: "2026-10",
    title: {
      en: "AWS Agent Experience Hackathon: Grandma's Bouncer",
      es: "Hackathon AWS Agent Experience: Grandma's Bouncer",
    },
    detail: {
      en: "Built a guardrail that keeps scam emails away from an AI assistant that handles bill payments.",
      es: "Construí un guardrail que mantiene los correos de estafa lejos de un asistente de IA que paga cuentas.",
    },
  },
  {
    date: "2026-10",
    title: {
      en: "Qollab × IonQ hackathon: Quantum Dice",
      es: "Hackathon Qollab × IonQ: Quantum Dice",
    },
    detail: {
      en: "Certified random bits from a Bell (CHSH) violation measured on IonQ hardware.",
      es: "Bits aleatorios certificados a partir de una violación de Bell (CHSH) medida en hardware de IonQ.",
    },
  },
  {
    date: "2026-01",
    title: { en: "Academic tutor, Univalle", es: "Monitor académico, Univalle" },
    detail: {
      en: "Jan–Jul 2026. Tutoring Imperative, Object-Oriented, Event-Driven and Functional Programming.",
      es: "Ene–Jul 2026. Monitoría de Programación Imperativa, Orientada a Objetos, Orientada a Eventos y Funcional.",
    },
  },
  {
    date: "2026",
    title: {
      en: "Partnerships & Academy Lead, AWS Student Builder Group Univalle",
      es: "Líder de Alianzas y Academia, AWS Student Builder Group Univalle",
    },
    detail: {
      en: "Core team member running partnerships and learning programs for the student cloud community.",
      es: "Miembro del equipo central a cargo de alianzas y programas de aprendizaje de la comunidad estudiantil de nube.",
    },
  },
  {
    date: "2026",
    title: { en: "AWS Certified Cloud Practitioner", es: "AWS Certified Cloud Practitioner" },
    detail: {
      en: "Earned the AWS foundational certification.",
      es: "Obtuve la certificación fundacional de AWS.",
    },
  },
  {
    date: "2024-02",
    title: {
      en: "Started Systems Engineering at Universidad del Valle",
      es: "Inicio de Ingeniería de Sistemas en la Universidad del Valle",
    },
    detail: {
      en: "The first episode of the series.",
      es: "El primer episodio de la serie.",
    },
  },
];

export type NextMission = {
  title: Record<Lang, string>;
  status: Record<Lang, string>;
};

/** Goals, not achievements: rendered apart from the timeline. */
export const nextMissions: NextMission[] = [
  {
    title: {
      en: "AWS Certified Solutions Architect – Associate",
      es: "AWS Certified Solutions Architect – Associate",
    },
    status: { en: "In preparation", es: "En preparación" },
  },
  {
    title: { en: "AWS Certified AI Practitioner", es: "AWS Certified AI Practitioner" },
    status: { en: "Next goal", es: "Próxima meta" },
  },
];
