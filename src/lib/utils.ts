import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Swaps colour emoji in copy for their monochrome text glyphs (display only; data stays as written). */
export function monoGlyphs(text: string): string {
  return text.replace(/\u2B50\uFE0F?/g, "★");
}
