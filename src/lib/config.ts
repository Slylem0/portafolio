type Outputs = { custom?: { triadUrl?: unknown } };

/** Extracts `custom.triadUrl` from the result of import.meta.glob("/amplify_outputs.json"). */
export function readTriadUrl(modules: Record<string, unknown>): string | null {
  const mod = modules["/amplify_outputs.json"] as { default?: Outputs } & Outputs | undefined;
  const url = (mod?.default ?? mod)?.custom?.triadUrl;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

/** TRIAD Function URL from amplify_outputs.json, or null when the backend is not deployed. */
export function getTriadUrl(): string | null {
  return readTriadUrl(import.meta.glob("/amplify_outputs.json", { eager: true }));
}
