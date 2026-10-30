import type { Lang } from "@/i18n";

export type Session = {
  n: number;
  slug: string;
  name: string;
  pitch: Record<Lang, string>;
  stack: string[];
  links: { label: string; href: string }[];
  status?: Record<Lang, string>;
  stars?: number;
};

const gh = (repo: string) => `https://github.com/Slylem0/${repo}`;

export const sessions: Session[] = [
  {
    n: 1,
    slug: "shaggy-barber",
    name: "Shaggy Barber",
    pitch: {
      en: "Booking platform for a real barbershop. Serverless on AWS with IaC: no double booking, WhatsApp reminders, passwordless accounts and an admin panel with MFA.",
      es: "Plataforma de reservas para una barbería real. Serverless en AWS con IaC: sin doble reserva, recordatorios por WhatsApp, cuentas sin contraseña y panel de admin con MFA.",
    },
    stack: ["Astro", "TypeScript", "Tailwind", "CDK", "Lambda", "DynamoDB", "API Gateway", "Cognito", "EventBridge"],
    links: [{ label: "LIVE", href: "https://d2ficupb35lp6p.cloudfront.net" }],
    status: {
      en: "STATUS: IN PRODUCTION PREP · frontend live, serverless backend in progress",
      es: "ESTADO: EN PREPARACIÓN PARA PRODUCCIÓN · frontend en línea, backend serverless en progreso",
    },
  },
  {
    n: 2,
    slug: "grandmas-bouncer",
    name: "Grandma's Bouncer",
    pitch: {
      en: "A Strands Decider 2B guardrail that stops scam emails from hijacking an AI assistant that pays a 72-year-old's bills.",
      es: "Un guardrail con Strands Decider 2B que evita que correos de estafa secuestren a un asistente de IA que paga las cuentas de una mujer de 72 años.",
    },
    stack: ["Strands Agents", "Decider 2B", "Bedrock (Nova 2 Lite)"],
    links: [
      { label: "GITHUB", href: gh("grandmas-bouncer") },
      { label: "DEMO", href: "https://youtu.be/OS2RwfqWgh8" },
    ],
  },
  {
    n: 3,
    slug: "dr-cloud",
    name: "Dr. Cloud",
    pitch: {
      en: "First aid for AWS errors: paste an error and an AI agent returns a diagnosis, a step-by-step prescription and a check-up. Least-privilege by design.",
      es: "Primeros auxilios para errores de AWS: pega un error y un agente de IA devuelve diagnóstico, receta paso a paso y chequeo. Mínimo privilegio por diseño.",
    },
    stack: ["Bedrock", "Strands", "Streamlit", "App Runner", "ECR", "IAM"],
    links: [{ label: "GITHUB", href: gh("AWS-Weekend-challenge") }],
  },
  {
    n: 4,
    slug: "aws-daily-topic-agent",
    name: "AWS Daily Topic Agent",
    pitch: {
      en: "Autonomous agent that publishes a bilingual AWS Cloud Practitioner topic every morning for the university's Builder Group. Zero human input.",
      es: "Agente autónomo que publica cada mañana un tema bilingüe de AWS Cloud Practitioner para el Builder Group de la universidad. Cero intervención humana.",
    },
    stack: ["EventBridge Scheduler", "Lambda", "Bedrock (Nova)", "S3"],
    links: [{ label: "GITHUB", href: gh("aws-daily-topic-agent") }],
  },
  {
    n: 5,
    slug: "quantum-dice",
    name: "Quantum Dice",
    pitch: {
      en: "Randomness certified by physics: measures a Bell (CHSH) violation on IonQ and turns it into certified random bits. Qollab × IonQ hackathon 2026.",
      es: "Aleatoriedad certificada por la física: mide una violación de Bell (CHSH) en IonQ y la convierte en bits aleatorios certificados. Hackathon Qollab × IonQ 2026.",
    },
    stack: ["Python", "Qiskit", "IonQ"],
    links: [{ label: "GITHUB", href: gh("quantum_dice") }],
  },
  {
    n: 6,
    slug: "omarchy-display-switch",
    name: "Omarchy Display Switch",
    pitch: {
      en: "Win+P for Hyprland/Omarchy: PC only, duplicate, extend or second screen only, with rotation and scale remembered per display.",
      es: "Win+P para Hyprland/Omarchy: solo PC, duplicar, extender o solo segunda pantalla, con rotación y escala recordadas por pantalla.",
    },
    stack: ["QML", "Shell", "Hyprland"],
    links: [{ label: "GITHUB", href: gh("omarchy-display-switch") }],
    stars: 11,
  },
  {
    n: 7,
    slug: "compressed-range-engine",
    name: "Compressed-range query engine",
    pitch: {
      en: "Answers queries and updates over huge sequences stored as compressed ranges, without expanding them. Algorithms final project.",
      es: "Responde consultas y actualizaciones sobre secuencias enormes almacenadas como rangos comprimidos, sin expandirlas. Proyecto final de algoritmos.",
    },
    stack: ["C++", "Algorithms"],
    links: [{ label: "GITHUB", href: gh("ADA_final_project") }],
  },
];
