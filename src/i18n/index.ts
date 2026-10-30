import { useCallback, useEffect, useSyncExternalStore } from "react";
import { en } from "./en";
import { es } from "./es";

export type Lang = "en" | "es";
export type Dict = typeof en;

export const dicts: Record<Lang, Dict> = { en, es };

const KEY = "lang";
const EVENT = "lang-change";

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function getInitialLang(storage?: Pick<Storage, "getItem">): Lang {
  try {
    const s = storage ?? defaultStorage();
    const v = s?.getItem(KEY);
    return v === "en" || v === "es" ? v : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang: Lang, storage?: Pick<Storage, "setItem">): void {
  try {
    const s = storage ?? defaultStorage();
    s?.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
}

let current: Lang | null = null;

function getSnapshot(): Lang {
  if (current === null) current = getInitialLang();
  return current;
}

function subscribe(cb: () => void): () => void {
  const handler = (e: Event) => {
    const next = (e as CustomEvent<Lang>).detail;
    if (next === "en" || next === "es") current = next;
    cb();
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function useLang(): { lang: Lang; t: Dict; setLang(l: Lang): void } {
  // Server and first client render use "en"; islands then sync to the stored value.
  const lang = useSyncExternalStore(subscribe, getSnapshot, () => "en" as Lang);
  const setLang = useCallback((l: Lang) => {
    current = l;
    saveLang(l);
    window.dispatchEvent(new CustomEvent<Lang>(EVENT, { detail: l }));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return { lang, t: dicts[lang], setLang };
}
